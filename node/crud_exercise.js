var uuid = require('uuid');
var couchbase = require('couchbase');
var connection = require('./connection');

var cluster = new couchbase.Cluster(connection.node);

var bucket = cluster.openBucket('Auction', function(err) {
  if(err) {
    // Failed to connect to cluster
    throw err;
  }

  // Initialize a counter at value 1000
  bucket.counter('myCounter', 1, {initial:100}, function(err, result) {
    if(err) { 
      // Failed to create counter
      throw err;
    } 

    counterValue = result.value;

    var key = uuid.v1();
    var doc = {'amount': counterValue, 'item': 'bike', 'user': 'Dean', 'date': new Date};

    console.log("Original doc:", JSON.stringify(doc));

    // Write a bid
    bucket.insert(key, doc, function(err, result) {
      if(err) {
        // Failed to write doc
        throw err;
      }
  
      // Get the document again
      bucket.get(key, function(err, result) {
        if(err) {
          // Failed to retrieve doc
          throw err;
        } 

        doc = result.value;

        console.log("Retrieved doc:", JSON.stringify(doc));

        // Change the bidder to Chris
        doc.user = "Chris";

        console.log("Changed doc:", JSON.stringify(doc));

        // Write the change back as a new document
        bucket.replace(key, doc, function(err, result) {
          if(err) {
            // Failed to write key
            throw err;
          }

          console.log("Check this document in the Couchbase web UI: ", key);
 
          // Success!
          process.exit(0);
        });
      });
    });
  });
});
