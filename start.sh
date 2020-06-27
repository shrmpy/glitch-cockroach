# work dir (won't be copied by glitch remix)
cd ~/.data

if [ ! -f ./cockroach ]; then
  wget -qO- https://binaries.cockroachdb.com/cockroach-v20.1.2.linux-amd64.tgz | tar  xvz
  cp cockroach-v20.1.2.linux-amd64/cockroach .
  rm -rf cockroach-v20.1.2.linux-amd64
fi

cockroach start --insecure --store=roachnode1 --listen-addr=localhost:26257 --http-addr=localhost:8080 --join=localhost:26257,localhost:26258,localhost:26259 --background
cockroach start --insecure --store=roachnode2 --listen-addr=localhost:26258 --http-addr=localhost:8081 --join=localhost:26257,localhost:26258,localhost:26259 --background
cockroach start --insecure --store=roachnode3 --listen-addr=localhost:26259 --http-addr=localhost:8082 --join=localhost:26257,localhost:26258,localhost:26259 --background
cockroach init --insecure --host=localhost:26257

# zap&recreate data (to allow re-entrant flow)
cockroach sql --insecure  \
              --execute="CREATE USER IF NOT EXISTS maxroach;DROP DATABASE IF EXISTS bank;" \
              --execute="CREATE DATABASE bank;" \
              --execute="GRANT ALL ON DATABASE bank TO maxroach;" 

# exercise nodeJS client API
node ~/basic-sample.js
node --trace-warnings ~/txn-single.js

# throttle (give glitch idle cycles)
sleep 1m


#PGUSER=maxroach \
#PGHOST=localhost \
#PGDATABASE=bank \
#PGPORT=26257 \
