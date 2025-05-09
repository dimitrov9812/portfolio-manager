const IODesktop = require("@interopio/desktop");
const IOConnectDesktop = require("@interopio/desktop");

const instruments = [];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const initializeIOConnect = async () => {
    // Optional configuration for initializing the library.
    const config = { appManager: "full" };

    // Use the object returned by the factory function to access the io.Connect APIs.
    const io = await IODesktop(config);

    // Here io.Connect is initialized and you can access all io.Connect APIs.
    
    return io;
};
async function fetchTickers(url) {
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  
    const data = await response.json();
    return data;
}
  
// Usage example
fetchTickers("http://localhost:3000/tickers")
.then((tickers) => {
    console.log("Fetching information for tickers:");
    tickers.forEach(ticker => {
        console.log(`${ticker.symbol}: ${ticker.fullName}`);
    });

    tickers.forEach(ticker => {
        instruments.push(ticker.symbol);
    });

    initializeIOConnect()
    .then((io) => {
        console.log(`io.Connect version: ${io.version}`);
        //let carMakeFilter = "BMW";

        const streamDefinition = {
            name: "Demo.LastTradesPricesStream",
            displayName: "Trades - Last trade price changes",
            returns: "String symbol, Double lastPrice"
        };

        let options = {
            subscriptionRequestHandler: (streamSubscription) => {
                console.log("Instance requesting subscription");
                console.log("Accepting on stream and navigating it to branch: " + streamSubscription.instance.pid);
                streamSubscription.acceptOnBranch(streamSubscription.instance.pid.toString());
            }
        }
        
        io
        .interop
        .createStream(streamDefinition, options)
        .then((stream) => {
            setInterval(() => {
                if (stream.branches().length == 0) {
                    console.log("No stream branches currenlty active");
                    return;
                }

                console.log("Handling Stream for branches:");
                stream.branches().forEach((branch) => {
                    // console.log("Branch key: " + branch.key);
                    // console.log("Subscriptions to that branch: ");
                    // console.log(branch.subscriptions());

                    branch.subscriptions().forEach((subscription) => {
                        console.log("---------- Subscription Details -------------");
                        console.log("Branch: " + subscription.branchKey);
                        console.log(subscription.arguments);
                        console.log("---------------------------------------------");

                        const lastTradePrice = {
                            tickerSybol: instruments[random(0, instruments.length - 1)],
                            lastPrice: random(10, 1000)
                        }
                        
                        if (lastTradePrice.tickerSybol == subscription.arguments.symbol) {
                            console.log("================================== PUBLISHING TO BRANCH: " + branch.key + " " + lastTradePrice.tickerSybol);
                            stream.push(lastTradePrice, subscription.branchKey);
                            return;
                        }

                        console.log("SKIPPING PUBLISHING TO PUBLISHING TO BRANCH: " + branch.key + " " + lastTradePrice.tickerSybol);
                    })
                });
            }, 3000)
        });
    })
    .catch(console.error);
})
.catch((err) => {
    console.error('Failed to fetch tickers:', err);
});