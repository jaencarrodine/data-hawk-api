const puppeteer = require('puppeteer')
const fs = require('fs');
const { type } = require('os');
 
async function openPage() {
    try{

        console.log("Opening page")
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        // get user agent from looking it up on google, prevents pages from detecting the scraper as a robot
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36')
        let boardNameList = []
        url = 'https://master.dc4py92bnlvhs.amplifyapp.com/'
    
        
        await page.goto(url, {waitUntil: 'networkidle2'})
    
        
        let mets = await page.metrics()
        console.log(mets)
        
            
        
        

        
        browser.close()
    
    //return boardnames
    } catch (e){
        console.log('our error', e)
    }
}

openPage()