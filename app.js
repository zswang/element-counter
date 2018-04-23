const puppeteer = require('puppeteer')

let browser
let page

function elementCounter() {
  return Array.from(document.body.querySelectorAll('*')).reduce(
    (counter, element) => {
      var tagName = String(element.tagName).toLowerCase()
      if (['script', 'style'].indexOf(tagName) >= 0) {
        return counter
      }
      if (
        tagName !== 'svg' &&
        element.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ) {
        return counter
      }
      counter[tagName] = counter[tagName] || 0
      counter[tagName]++
      return counter
    },
    {}
  )
}

const fs = require('fs')
const pages = JSON.parse(fs.readFileSync(process.argv[2]))

puppeteer
  .launch()
  .then(reply => {
    browser = reply
    return new Promise((resolve, reject) => {
      let index = 0
      let result = []
      function next() {
        let url = pages[index++]
        if (!url) {
          resolve(result)
          return
        }
        let page
        return browser
          .newPage()
          .then(reply => {
            page = reply
            return page.goto(url)
          })
          .then(reply => {
            return page.evaluate(elementCounter)
          })
          .then(reply => {
            result.push(reply)
            next()
          })
          .catch(err => {
            reject(err)
          })
      }
      next()
    })
  })
  .then(reply => {
    console.log(
      JSON.stringify(
        reply.reduce((counter, item) => {
          Object.keys(item).forEach(key => {
            counter[key] = counter[key] || 0
            counter[key] += item[key]
          })
          return counter
        }, {}),
        null,
        '  '
      )
    )
    browser.close()
  })
  .catch(err => {
    console.log(err)
  })
