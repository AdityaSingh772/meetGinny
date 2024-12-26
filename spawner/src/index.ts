import { Builder, Browser, By, Key, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

async function main() {
    const options = new Options();
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.addArguments("--use-fake-ui-for-media-stream"); 
    options.addArguments("--start-maximized");

    let driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options)
        .build();

    try {
        await driver.get('https://meet.google.com/gmo-emet-cgb');
        await driver.sleep(3000);
        const popupButton = await driver.wait(
            until.elementLocated(By.xpath('//span[contains(text(),"Got it")]')),
            100000
        );
        await popupButton.click();
        const inputName = await driver.wait(until.elementLocated(By.xpath('//input[@placeholder="Your name"]')), 20000);
        await inputName.clear();
        await inputName.click();
        await inputName.sendKeys('value' , "Ginny bot");
        const buttonInput = await driver.wait(
            until.elementLocated(By.xpath('//span[contains(text(),"Ask to join") or contains(text(),"Join")]')),
            100000
        );
        await buttonInput.click(); 

        await driver.wait(until.elementLocated(By.id('aa1313212a')), 1000000)
                
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await driver.quit();
    }
}

main();
