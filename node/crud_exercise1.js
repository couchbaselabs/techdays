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

  // Initialize a counter at value 100
  bucket.counter('myCounter', 1, {initial:100}, function(err, result) {
    if(err) { 
      // Failed to create counter
      throw err;
    } 

    // Saving the counter value to a variable
    counterValue = result.value;

    // Generating a new key, in this case just a UUID
    var key = uuid.v1();

    // Creating a new bid document
    // Setting amount equal to the value of our counter
    var doc = {'amount': counterValue, 'item': 'bike', 'user': 'Dean', 'date': new Date};

    // Saving the bid document to Couchbase
    bucket.insert(key, doc, function(err, result) {
      if(err) {
        // Failed to write doc
        throw err;
      }

      console.log("Check this document in the Couchbase web UI: ", key);

      // Success!
      process.exit(0);
    });
  });
});
