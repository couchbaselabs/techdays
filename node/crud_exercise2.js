var uuid = require('uuid');

// Including the Couchbase SDK and the node we configured
var couchbase = require('couchbase');
var connection = require('./connection');

// Set this to the guid of the bid you created
var key = '4d696b90-5048-11e5-b615-bfdecd7d76d8';

// Instantiating the Couchbase cluster object using the node we configured
var cluster = new couchbase.Cluster(connection.node);

// Opening a connection to the travel-sample bucket
var bucket = cluster.openBucket('travel-sample', function(err) {
  if(err) {
    // Failed to connect to cluster
    throw err;
  }

  // Get the bid document
  bucket.get(key, function(err, result) {
    if(err) {
      // Failed to retrieve doc
      throw err;
    } 

    // Set the value of the document to a variable
    doc = result.value;

    console.log("Retrieved doc:", JSON.stringify(doc));

    // Change the bid amount to 50
    doc.amount = 50;

    console.log("Changed doc:", JSON.stringify(doc));

    // Update the document in Couchbase
    bucket.replace(key, doc, function(err, result) {
      if(err) {
        // Failed to write key
        throw err;
      }

      console.log("Check the " + key + " document in the Couchbase web UI");
 
      // Success!
      process.exit(0);
    });
  });
});
