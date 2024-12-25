const { createClient } = require('graphql-ws');
const WebSocket = require('ws'); // Required to support WebSocket in Electron

async function loadStore() {
    const { default: Store } = await import('electron-store');
    return new Store();
}


const client = createClient({
    url: 'wss://api.appscaps.tech/subscriptions', // Replace with your server URL
    webSocketImpl: WebSocket, // Required to work in Electron
    connectionParams: {
        reconnect: true, // Optional: handles reconnection
    },
    on: {
        connected: async () => {
            console.log('WebSocket connected');
            // post to api.appscaps.tech/log
            // with the following body: { message: 'WebSocket connected' }
            fetch('https://api.appscaps.tech/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: new Date()+ 'WebSocket connected: ' + (await loadStore()).get('userName') }),
            })
        },
        closed: async () => {
            console.log('WebSocket connection closed');
            fetch('https://api.appscaps.tech/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: new Date()+ 'WebSocket disconnected: ' + (await loadStore()).get('userName') }),
            })
        },
    },
    shouldRetry: (error) => {
        console.log("retrying", error);
        return true;
    },
    retryAttempts: 100,
});

function subscribeToNewOrders(token, onNewOrder) {

    const unsubscribe = client.subscribe(
        {
            query: `
                subscription Subscription($token: String!) {
                  newOrder(token: $token) {
                    order {
                      clientName
                      clientPhone
                      phoneCountry
                      paymentMethod
                      address
                      prepareTime
                      deliveryFee
                      prepareType
                      couponCode
                      numberOfPersons
                      deliveryType
                      note
                      items {
                        title
                        currentValue
                        price
                        options {
                          title
                          options {
                            price
                            title
                            currentValue
                            portion
                          }
                        }
                      }
                    }
                    grandTotal
                    id
                    workPlaceId
                    total
                    createdAt
                    deliveryFee
                    workPlaceStyle {
                      images {
                        ReceiptsLogo
                      }
                    }
                  }
                }
            `,
            variables: { token },
        },
        {
            next: (data) => {
                if (data.data && data.data.newOrder) {
                    onNewOrder(data.data.newOrder);
                } else {
                    console.log('No new order data received or data is undefined:', data);
                }
            },
            error: (err) => console.error('Subscription error', err),
        }
    );

    return unsubscribe; // Call this function to unsubscribe when needed
}

module.exports = { subscribeToNewOrders };
