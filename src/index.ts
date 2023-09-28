import { Locator, Page } from "playwright";

export async function clickIfElementExists(page: Page, selector: string): Promise<void> {
    const yourLocator = page.locator(selector)
    const elementIsNotNull = await yourLocator.evaluate(elem => elem !== null);
    if (elementIsNotNull) {
        return await yourLocator.click();
    }
}

export async function elementExists(page: Page, selector: string) {
    const yourLocator = page.locator(selector)
    return await yourLocator.evaluate(elem => elem !== null);
}

export async function waitForLocator(locator: Locator): Promise<Locator> {
    await locator.waitFor();
    return locator;
};

export async function scrollTo(page: Page, location: "up" | "down"): Promise<void> {
    if (location == "down") {
        return await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else {
        return await page.evaluate(() => window.scrollTo(0, 0));
    }
};

export async function scrollDownSmoothly(page: Page, scrollMovement = 100, delay = 100): Promise<void> {
    return await page.evaluate(async () => {
        const delayFn = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));
        for (let i = 0; i < document.body.scrollHeight; i += scrollMovement) {
            window.scrollTo(0, i);
            await delayFn(delay);
        }
    });
}

export async function clickHiddenElement(page: Page, selector: string): Promise<void> {
    await page.waitForSelector(selector);
    return await page.evaluate((selector): void => {
        const element = document.querySelector(selector);
        const clickEvent = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        element?.dispatchEvent(clickEvent);
    }, selector);
}

export async function getElementTextContent(page: Page, selector: string): Promise<string | undefined> {
    await page.waitForSelector(selector);
    const element = page.locator(selector);
    const textContent = await element.textContent();
    return textContent?.trim();
}

export async function typeWithDelay(page: Page, selector: string, text: string, delay = 100) {
    await page.waitForSelector(selector);
    const element = page.locator(selector);
    for (const char of text) {
        await element.type(char, { delay });
    }
}

export async function getElementAttributeValue(page: Page, selector: string, attributeName: string): Promise<string | null> {
    await page.waitForSelector(selector);
    const element = page.locator(selector);
    const attributeValue = await element.getAttribute(attributeName);
    return attributeValue;
}

export async function getElementCount(page: Page, selector: string) {
    const elements = page.locator(selector);
    return elements.count;
}

export async function forEachElement(page: Page, selector: string, callback: (element: Locator, index: number) => Promise<void>) {
    const elements = page.locator(selector);
    for (let index = 0; index < await elements.count(); index++) {
        const element = elements.nth(index);
        callback(element, index);
    }
}

export interface AzureAdLoginOption {
    username: string;
    password: string;
    storagePath?: string;
    beforeLogin?: () => Promise<void>;
    afterLogin?: () => Promise<void>;
    onException?: (error: any) => Promise<void>;
    onFinalize?: () => Promise<void>;
}

export async function loginWithAzureAdPopup(page: Page, options: AzureAdLoginOption): Promise<{ result: boolean, error: Error | null }> {
    try {
        const [popup] = await Promise.all([
            page.waitForEvent("popup"),
            options.beforeLogin?.()
        ]);
        await Promise.all([
            page.waitForLoadState("domcontentloaded"),
            page.waitForLoadState("networkidle"),
            page.waitForLoadState("load"),
        ]);
        await popup.waitForSelector("#i0116");
        await popup.fill("#i0116", options.username);
        await popup.click("#idSIButton9");
        await Promise.all([
            page.waitForLoadState("domcontentloaded"),
            page.waitForLoadState("networkidle"),
            page.waitForLoadState("load"),
        ]);
        await popup.waitForSelector("#i0118");
        await popup.fill("#i0118", options.password);
        await popup.click("#idSIButton9");
        await Promise.all([
            page.waitForLoadState("domcontentloaded"),
            page.waitForLoadState("networkidle"),
            page.waitForLoadState("load"),
        ]);
        if (await popup.$("#KmsiCheckboxField") !== null) {
            await popup.locator("#KmsiCheckboxField").check();
            await popup.locator("#idSIButton9").click();
        }
        await Promise.all([
            page.waitForLoadState("domcontentloaded"),
            page.waitForLoadState("networkidle"),
            page.waitForLoadState("load"),
        ]);
        await options.afterLogin?.();

        if (options.storagePath != null && options.storagePath.match(/^ *$/) == null)
            await page.context().storageState({ path: options.storagePath });

        return {
            result: true,
            error: null,
        };
    } catch (error) {
        await options.onException?.(error);
        return {
            result: false,
            error: error as Error
        };
    } finally {
        await options.onFinalize?.();
    }
}

export async function findBrokenImages(page: Page,): Promise<string[]> {
    const failedRequests: string[] = [];
    page.context().on("requestfailed", request => {
        if (request.resourceType() === "image") {
            failedRequests.push(request.url());
        }
    });
    await page.waitForLoadState("networkidle");
    return failedRequests;
}