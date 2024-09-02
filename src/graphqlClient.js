const { createClient } = require('graphql-ws');
const WebSocket = require('ws'); // Required to support WebSocket in Electron

const client = createClient({
    url: 'wss://api.appscaps.tech/subscriptions', // Replace with your server URL
    webSocketImpl: WebSocket, // Required to work in Electron
    connectionParams: {
        reconnect: true, // Optional: handles reconnection
    },
    on: {
        connected: () => console.log('WebSocket connected'),
        closed: () => console.log('WebSocket connection closed'),
    },
    shouldRetry: (error) => {
        console.log("retrying", error);
        return true;
    },
    retryAttempts: 100,
});

function subscribeToNewOrders(token, onNewOrder) {
    console.log("Subscribing to new orders");

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
