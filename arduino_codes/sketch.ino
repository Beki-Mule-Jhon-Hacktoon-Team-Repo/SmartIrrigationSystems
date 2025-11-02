#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <qrcodeoled.h>
#include <SSD1306.h>

// ===== WiFi Credentials =====
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASS ""

// ===== Backend URL =====
#define BACKEND_URL "https://smartirrigationsystems.onrender.com"

// ===== Sensor Pins =====
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
#define PH_PIN 35
#define NPK_PIN 32

// ===== Actuator Pins =====
#define RELAY_PIN 18
#define SERVO_PIN 5
#define LED_PIN 2

// ===== State Machine =====
enum DeviceState {
  STATE_INIT,
  STATE_WAITING_REGISTRATION,
  STATE_REGISTERED,
  STATE_ACTIVE
};

// ===== Devices =====
SSD1306 display(0x3c, 21, 22);  // Address, SDA, SCL
QRcodeOled qrcode(&display);
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo valveServo;
bool pumpState = false;
String deviceID;
DeviceState currentState = STATE_INIT;
unsigned long lastCheckTime = 0;
const unsigned long CHECK_INTERVAL = 10000; // 10 seconds

// ===== Function: Display QR Code with Device ID =====
void displayQRCode(String text) {
  display.clear();

  display.setFont(ArialMT_Plain_10);
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.drawString(64, 0, "Device ID QR");

  qrcode.init();
  qrcode.create(text);

  display.drawString(64, 55, text);  // show device ID below QR
  display.display();
}

// ===== Function: Display Agresense System / Soil Dry =====
void displayAgresenseSystem(bool soilDry = false) {
  display.clear();
  display.setFont(ArialMT_Plain_24);
  display.setTextAlignment(TEXT_ALIGN_CENTER);

  if (soilDry) {
    // Adjust Y coordinates to fit the screen
    display.drawString(64, 15, "Soil Dry!");
    display.drawString(64, 35, "Watering...");
  } else {
    display.drawString(64, 15, "Agresense");
    display.drawString(64, 35, "System");
  }

  display.display();
}


// ===== Function: Check Registration Status =====
bool checkRegistrationStatus() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/api/v1/sensor/device-status/" + deviceID;
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      bool registered = doc["registered"];
      String status = doc["status"];
      http.end();
      if (registered && status == "active") {
        Serial.println("✅ Device is registered and active!");
        return true;
      }
    }
  }

  http.end();
  return false;
}

// ===== Function: Show Waiting Message =====
void showWaitingMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Waiting for");
  lcd.setCursor(0, 1);
  lcd.print("Registration...");
}

// ===== Function: Show Registered Message =====
void showRegisteredMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Registered!");
  lcd.setCursor(0, 1);
  lcd.print("Starting system");
  delay(2000);
}

// ===== Function: Read pH =====
float readPH() {
  int phRaw = analogRead(PH_PIN);
  float voltage = phRaw * (3.3 / 4095.0);
  float phValue = 7 + ((2.5 - voltage) * 3.5);
  return phValue;
}

// ===== Function: Read NPK (in ppm) =====
int readNPK() {
  int npkRaw = analogRead(NPK_PIN);
  int npkPPM = map(npkRaw, 0, 4095, 0, 3000); // map to 0–3000 ppm
  return npkPPM;
}

// ===== Function: Send Data to Backend =====
void sendToBackend(float temp, float hum, int soil, float ph, int npk) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/api/v1/sensor/" + deviceID;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["soil"] = soil;
  doc["pump"] = pumpState ? 1 : 0;
  doc["ph"] = ph;
  doc["npk"] = npk;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  if (httpCode == 201 || httpCode == 200) {
    Serial.println("📊 Data sent to backend");
  } else {
    Serial.printf("❌ Failed to send data, HTTP code: %d\n", httpCode);
  }
  http.end();
}

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  Serial.println("🌱 Starting Smart Irrigation System...");

  deviceID = String((uint32_t)ESP.getEfuseMac(), HEX);
  deviceID.toUpperCase();
  Serial.println("🆔 Device ID: " + deviceID);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  // Initialize OLED
  display.init();
  display.flipScreenVertically();
  display.setFont(ArialMT_Plain_10);

  // Initialize sensors/actuators
  dht.begin();
  valveServo.attach(SERVO_PIN);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  valveServo.write(0);

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected!");

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
  delay(1000);

  // Display QR Code at start
  displayQRCode(deviceID);

  showWaitingMessage();
  currentState = STATE_WAITING_REGISTRATION;
  Serial.println("⏳ Waiting for device registration...");
}

// ===== Loop =====
void loop() {
  switch (currentState) {
    case STATE_WAITING_REGISTRATION:
      if (millis() - lastCheckTime >= CHECK_INTERVAL) {
        lastCheckTime = millis();
        Serial.println("🔍 Checking registration status...");
        if (checkRegistrationStatus()) {
          currentState = STATE_REGISTERED;
          showRegisteredMessage();

          // Remove QR code, display system text
          displayAgresenseSystem(false);

          currentState = STATE_ACTIVE;
          Serial.println("✅ System is now ACTIVE!");
        } else {
          Serial.println("⏳ Still waiting for registration...");
          digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        }
      }
      break;

    case STATE_ACTIVE: {
      float temp = dht.readTemperature();
      float hum = dht.readHumidity();
      int soilRaw = analogRead(SOIL_PIN);
      int soilMoisture = map(soilRaw, 4095, 0, 0, 100);
      float phValue = readPH();
      int npkLevel = readNPK();

      if (isnan(temp)) temp = 0;
      if (isnan(hum)) hum = 0;

      // Auto irrigation logic
      if (soilMoisture < 40 && !pumpState) {
        digitalWrite(RELAY_PIN, HIGH);
        digitalWrite(LED_PIN, HIGH);
        valveServo.write(90);
        pumpState = true;
        Serial.println("💧 Auto irrigation ON - Soil dry");

        // OLED: Soil dry
        displayAgresenseSystem(true);

      } else if (soilMoisture >= 60 && pumpState) {
        digitalWrite(RELAY_PIN, LOW);
        digitalWrite(LED_PIN, LOW);
        valveServo.write(0);
        pumpState = false;
        Serial.println("✅ Auto irrigation OFF - Soil moist");

        // OLED: Normal system
        displayAgresenseSystem(false);
      }

      // Update LCD
      lcd.setCursor(0, 0);
      lcd.print("T:");
      lcd.print(temp, 1);
      lcd.print("C H:");
      lcd.print(hum, 0);
      lcd.print("%  ");

      lcd.setCursor(0, 1);
      lcd.print("Soil:");
      lcd.print(soilMoisture);
      lcd.print("% ");
      lcd.print(pumpState ? "PUMP" : "OK  ");

      // Send data to backend
      sendToBackend(temp, hum, soilMoisture, phValue, npkLevel);

      delay(1000);
      break;
    }

    default:
      break;
  }
}
