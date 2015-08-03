var uuid = require('uuid');

// Here we are including the Couchbase SDK and the node we configured
var couchbase = require('couchbase');
var connection = require('./connection');

// Instantiating the Couchbase cluster object using the node we configured
var cluster = new couchbase.Cluster(connection.node);

// Opening a connection to the Auction bucket
var bucket = cluster.openBucket('Auction', function(err) {
  if(err) {
    // Failed to connect to cluster
    throw err;
  }

  // Next we start a bulk load of bids
  console.log('Loading bids...');
  loadBids(0);

  // This function models a bidding war between our 5 bidders.  Each bidder bids
  // one more than the last bid amount.
  function loadBids(count) {
    var maxBids = 1000;
    var bidders = ['Becky', 'Chris', 'Dean', 'Dipti', 'Rodney'];

    // Each loop selects a random bidder from our list above
    var bidder = bidders[Math.floor(Math.random() * bidders.length)];

    // The random bidder is inserted into a bid document and the amount is
    // set to 1000 + the current iteration
    var doc = {'amount': 1000 + count, 'item': 'bike', 'user': bidder, 'date': new Date};

    // Write the bid to Couchbase using a UUID as the key
    bucket.upsert(uuid.v1(), doc, function(err, result) {
      if(err) {
        console.log('Write error:', err);
	  process.exit(1);
      } 

      // Every 100 bids we'll output our progress
      if(count % 100 == 0) {
        console.log('Loaded ' + count + ' bids');
      }

      // Get some stats on the results of the bidding war once we've inserted all of the documents
      if(count == maxBids) {
	console.log('');
        console.log('Done loading bids.');
        console.log('Querying view...');
        console.log('');

        // Instantiate a query object
        var ViewQuery = couchbase.ViewQuery;
      
        // Query the bid-users view we created
        // .group(true) will group the bids by bidder
        // .stale(ViewQuery.Update.BEFORE) tells Couchbase to index any outstanding documents
        //    before returning us the answer
        var query = ViewQuery.from('bid-ddoc', 'bid-users').group(true).stale(ViewQuery.Update.BEFORE);

        bucket.query(query, function(err, results) {
          if(err) {
            // Error querying the view
            throw err;
          }
	  
          // Outputs a table showing each bidder, the number of bids they submitted, and their max bid.
	  console.log("Bidder\tTotal Bids\tMaxBid");
          console.log("------\t----------\t------");
          for(i in results) {
            // In our view, we indexed data like this:
            //    emit(doc.user, doc.amount) with a _stats reduce
            // The raw view output looks like this:
            //    {"key":"Becky","value":{"sum":3884918,"count":200,"min":1000,"max":2000,"sumsqr":15228043356}}
            //  The key in the result is doc.user 
            //  The value in the result is the _stats output.
            //  We are selecting the "count" and "max" stats for this table.            
            console.log(results[i].key + "\t" + results[i].value.count + "\t\t" + results[i].value.max);
          }

          // Success!
	  process.exit(0);
        });
      } else {
        // We haven't reached maxBids yet
        loadBids(count + 1);
      }
    });
  }
});
