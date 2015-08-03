var uuid = require('uuid');
var couchbase = require('couchbase');
var connection = require('./connection');

var cluster = new couchbase.Cluster(connection.node);

var bucket = cluster.openBucket('Auction', function(err) {
  if(err) {
    console.log('Connection Error:', err);
  }

  function loadBids(count) {
    var max   = 5000;
    var bidders = ['Becky', 'Chris', 'Dean', 'Dipti', 'Rodney'];

    var bidder = bidders[Math.floor(Math.random() * bidders.length)];

    var doc = {'amount': 1000 + count, 'item': 'bike', 'user': bidder, 'date': new Date};

    bucket.upsert(uuid.v1(), doc, function(err, result) {
      if(err) {
        console.log('Write error:', err);
	  process.exit(1);
      } 

      if(count % 1000 == 0) {
        console.log('Loaded ' + count + ' bids');
      }

      if(count == max) {
	console.log('');
        console.log('Done loading bids.');
        console.log('Querying view...');
        console.log('');

        var ViewQuery = couchbase.ViewQuery;
        var query = ViewQuery.from('bid-ddoc', 'bid-users').group(true).stale(ViewQuery.Update.BEFORE);

        bucket.query(query, function(err, results) {
          if(err) {
            console.log('View error:', err);
            process.exit(1);
          }
	  
	  console.log("Bidder\tTotal Bids\tMaxBid");
          console.log("------\t----------\t------");
          for(i in results) {
            console.log(results[i].key + "\t" + results[i].value.count + "\t\t" + results[i].value.max);
          }

	  process.exit(0);
        });
      } else {
        loadBids(count + 1);
      }
    });
  }

  console.log('Loading bids...');
  loadBids(0);
});
