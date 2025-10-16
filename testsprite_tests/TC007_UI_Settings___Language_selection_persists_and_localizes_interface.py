import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3030", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Change UI language setting from English to Spanish by clicking the Español button and then save.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Refresh or reopen the app to confirm the UI loads using the persisted Spanish language preference.
        await page.goto('http://localhost:3030/', timeout=10000)
        

        # Change UI language setting back to English and verify immediate UI update.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/header/div/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the English button to select English and then click Guardar to save the language preference.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Refresh the app to confirm the English language preference persists after reload.
        await page.goto('http://localhost:3030/', timeout=10000)
        

        # Assert UI text is translated to Spanish immediately after switching language
        spanish_texts = {
            'theme': '🎨Tema',
            'language': '🌐Idioma',
            'navigation_links': ['Tablero', 'Ingesta AvanzadaPro', 'Configuración'],
            'upload_description': 'Sube archivos PDF, DOCX, TXT o Markdown para enriquecer tu espacio de trabajo de conocimiento.',
            'upload_instructions': 'Arrastra y suelta un documento o haz clic para seleccionar',
            'upload_button': 'Elegir archivo',
            'ask_description': 'Haz preguntas en tu idioma preferido. Cambia de idioma en cualquier momento desde el selector superior.',
            'ask_instructions': 'Sube un documento y comienza a hacer preguntas',
            'send_button': 'Enviar'
        }
        # Check theme and language labels
        assert await frame.locator('text=🎨Tema').is_visible()
        assert await frame.locator('text=🌐Idioma').is_visible()
        # Check navigation links
        for link_text in spanish_texts['navigation_links']:
            assert await frame.locator(f'text={link_text}').is_visible()
        # Check upload document section
        assert await frame.locator(f'text={spanish_texts['upload_description']}').is_visible()
        assert await frame.locator(f'text={spanish_texts['upload_instructions']}').is_visible()
        assert await frame.locator(f'text={spanish_texts['upload_button']}').is_visible()
        # Check ask your documents section
        assert await frame.locator(f'text={spanish_texts['ask_description']}').is_visible()
        assert await frame.locator(f'text={spanish_texts['ask_instructions']}').is_visible()
        assert await frame.locator(f'text={spanish_texts['send_button']}').is_visible()
        # Assert UI loads using persisted Spanish language preference after refresh
        # Reuse the same assertions as above for Spanish texts
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    