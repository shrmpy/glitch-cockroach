// see www.cockroachlabs.com nodeJS quickstart
//
// EXCEPT without re-try / recovery until we understand logic flow better
//
const async = require('async')
const { Pool, Client } = require('pg')

const conf = {
	user: 'maxroach',
	database: 'bank',
	port: 26257,
	host: 'localhost'
}
const pool = new Pool(conf)
pool.on('error', (err, client) => {
	console.error("Unexpected error on idle client", err)
	process.exit(-1)
})


////////// Main program //////////

transaction()

async function transaction() {
	// make a client for waterfall scope
	const client = await pool.connect()
	waterfall(client, summary)
}

//////////  //////////

function waterfall(client, onsuccess) {
	// waterfall steps are run in order 
	// (not atomic) so it does not mean that other tasks won't be called 
	console.log("DEBUG waterfall starting")

	async.waterfall([
		(callback) => {
			console.log("step1")
			client.query('BEGIN; SAVEPOINT cockroach_restart', callback)
		},
		(input, callback) => {
			console.log("step2")
			client.query('SELECT balance FROM accounts WHERE id = 1', callback)
		},
		(input, callback) => {
			console.log("step3")
			let acctBal = input.rows[0].balance
			if (acctBal < 100) {
				callback(new Error('insufficient funds'))
			} else {
				client.query('UPDATE accounts SET balance = balance - 100 WHERE id = 1', callback)
			}
		},
		(input, callback) => {
			console.log("step4")
			client.query('UPDATE accounts SET balance = balance + 100 WHERE id = 2', callback)
		},
		(input, callback) => {
			console.log("step5")
			// If we reach this point, release and commit.
			client.query('RELEASE SAVEPOINT cockroach_restart', (err, res) => {
				client.query('COMMIT', callback)
			})
		}
		], (err, result) => {
			if (err) {
				client.query('ROLLBACK', (err, res) => {
					if (err) {
						console.log("FAILED rollback: ", err.stack)
					} else {
						console.log("rollback succeeded")
					}
				})
			} else {
				console.log("transaction complete: ", result)
				onsuccess()
			}
			// return to pool
			client.release()
		}
	)
}

// post-transaction summary
function summary() {
	// single-use query
	pool.query('SELECT id, balance FROM accounts', (err, res) => {
		console.log("Summary: ", res)
	})
}

