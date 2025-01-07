import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { io } from "socket.io-client";
import dotenv from "dotenv";
dotenv.config();
async function injectAudioRecorder(driver, socket) {
    const script = `
    (function() {
      if (!window.MediaRecorder) {
        alert('MediaRecorder not supported in this browser.');
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          let chunks = [];

          mediaRecorder.ondataavailable = function(e) {
            chunks.push(e.data);
          };

          mediaRecorder.onstop = function() {
            // Handle the stop event
          };
        })
        .catch(error => {
          console.error('Error accessing media devices.', error);
        });
    })();
  `;
    await driver.executeScript(script);
}
async function main() {
    let options = new chrome.Options();
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.addArguments("--use-fake-ui-for-media-stream");
    options.addArguments("--start-maximized");
    options.addArguments("--disable-web-security");
    let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
    let socket = io("http://localhost:3000");
    try {
        await driver.get("https://meet.google.com/csg-enwe-eym");
        const popupButton = await driver.wait(until.elementLocated(By.xpath('//span[contains(text(),"Got it")]')), 10000);
        await popupButton.click();
        const inputName = await driver.wait(until.elementLocated(By.xpath('//input[@placeholder="Your name"]')), 10000);
        await inputName.clear();
        await inputName.sendKeys("Ginny bot");
        const joinButton = await driver.wait(until.elementLocated(By.xpath('//span[contains(text(),"Ask to join") or contains(text(),"Join")]')), 10000);
        await joinButton.click();
        console.log("Waiting for meeting details element...");
        // await driver.wait(until.elementLocated(By.xpath('//div[@aria-label="Meeting details"]')), 60000);
        console.log("Joined the meeting successfully.");
        // Start recording
        await injectAudioRecorder(driver, socket);
        // Keep the bot running
        await driver.sleep(60 * 60 * 1000); // 1 hour
    }
    catch (error) {
        console.error("An error occurred:", error);
    }
    finally {
        await driver.quit();
    }
}
main();
