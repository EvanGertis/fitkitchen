if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/', function(req, res) {
    res.render('index.ejs')
})

app.get('/store', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      res.render('store.ejs', {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data)
      })
    }
  })
})

app.post('/purchase', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      const itemsJson = JSON.parse(data)
      const itemsArray = itemsJson.meals.concat(itemsJson.merch)
      let total = 0
      req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
          return i.id == item.id
        })
        total = total + itemJson.price * item.quantity
        stripe.orders.create({
          currency: 'usd',
          email: req.body.email,
          items: [
            {
              type: 'sku',
              parent: itemJson.sku,
              quantity: item.quantity,
            },
          ],
          shipping: {
            name: 'Jenny Rosen',
            address: {
              line1: '3618 Riverwatch Parkway Suite 7',
              city: 'Augusta',
              state: 'GA',
              postal_code: '30907',
              country: 'US',
            },
          },
        });
      })

      stripe.charges.create({
        amount: total,
        source: req.body.stripeTokenId,
        currency: 'usd'
      }).then(function() {
        console.log('Charge Successful')
        res.json({ message: 'Successfully purchased items' })
      }).catch(function() {
        console.log('Charge Fail')
        res.status(500).end()
      })
    }
  })
})

app.listen(process.env.PORT, process.env.IP, function(){
  console.log("FITKITCHEN");
});