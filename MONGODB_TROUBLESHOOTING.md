# MongoDB Connection Troubleshooting Guide

## 🔧 Quick Fixes for Connection Issues

### 1. Test Your Connection
Run the connection test script:
```bash
node test-db-connection.js
```

### 2. Check Your Environment Variables
Create a `.env` file in your project root with:
```env
# For local MongoDB
DB=mongodb://localhost:27017/laborlink

# For MongoDB Atlas (cloud)
DB=mongodb+srv://username:password@cluster.mongodb.net/laborlink?retryWrites=true&w=majority
```

### 3. Common Connection Issues & Solutions

#### ❌ "Server selection timed out"
**Causes:**
- MongoDB server is not running
- Network connectivity issues
- Incorrect connection string

**Solutions:**
```bash
# Check if MongoDB is running locally
mongod --version
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
net start MongoDB  # Windows
```

#### ❌ "ENOTFOUND" or DNS errors
**Causes:**
- Incorrect hostname in connection string
- Network/DNS issues

**Solutions:**
- Verify your MongoDB Atlas cluster URL
- Check your internet connection
- Try using IP address instead of hostname

#### ❌ "Authentication failed"
**Causes:**
- Wrong username/password
- User doesn't have proper permissions

**Solutions:**
- Verify credentials in MongoDB Atlas
- Ensure user has readWrite permissions
- Check if IP is whitelisted in Atlas

#### ❌ "ECONNREFUSED"
**Causes:**
- MongoDB not running on specified port
- Port blocked by firewall

**Solutions:**
```bash
# Check if port 27017 is open
netstat -an | grep 27017
telnet localhost 27017
```

### 4. MongoDB Atlas Specific Issues

#### IP Whitelist
1. Go to MongoDB Atlas dashboard
2. Navigate to Network Access
3. Add your current IP or use 0.0.0.0/0 for testing

#### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 5. Local MongoDB Setup

#### Install MongoDB Community Server
- **Windows**: Download from MongoDB website
- **macOS**: `brew install mongodb-community`
- **Linux**: Follow official MongoDB installation guide

#### Start MongoDB Service
```bash
# Linux
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

### 6. Connection String Examples

```javascript
// Local MongoDB
const localDB = "mongodb://localhost:27017/laborlink";

// Local with authentication
const localAuthDB = "mongodb://username:password@localhost:27017/laborlink";

// MongoDB Atlas
const atlasDB = "mongodb+srv://username:password@cluster.mongodb.net/laborlink?retryWrites=true&w=majority";

// Replica Set
const replicaSetDB = "mongodb://host1:27017,host2:27017,host3:27017/laborlink?replicaSet=myReplicaSet";
```

### 7. Improved Connection Options

The updated connection includes these stability improvements:
- **Automatic retry logic**: Retries failed connections
- **Connection pooling**: Maintains multiple connections
- **Heartbeat monitoring**: Regularly checks connection health
- **Graceful shutdown**: Properly closes connections on app termination
- **Event monitoring**: Logs connection state changes

### 8. Monitoring Connection Health

Access the health check endpoint:
```
GET https://laborlink.co.in/api/health
```

Response example:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "host": "cluster.mongodb.net",
    "name": "laborlink"
  },
  "server": {
    "port": 8500,
    "environment": "development"
  }
}
```

### 9. Production Recommendations

#### Connection String Security
- Store in environment variables, not in code
- Use MongoDB Atlas for production
- Enable authentication
- Use SSL/TLS connections

#### Monitoring
- Set up MongoDB monitoring
- Use connection pooling
- Implement proper error handling
- Log connection events

#### Performance
- Use indexes for frequently queried fields
- Implement connection pooling
- Monitor connection count
- Use read preferences for scaling

### 10. Emergency Recovery Steps

If your database is completely inaccessible:

1. **Check MongoDB status**:
   ```bash
   systemctl status mongod
   ```

2. **Check logs**:
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ```

3. **Restart MongoDB**:
   ```bash
   sudo systemctl restart mongod
   ```

4. **Check disk space**:
   ```bash
   df -h
   ```

5. **Repair database** (if corrupted):
   ```bash
   mongod --repair --dbpath /var/lib/mongodb
   ```

### 11. Contact Support

If issues persist:
- Check MongoDB Atlas status page
- Contact MongoDB support
- Review application logs
- Monitor system resources (CPU, RAM, disk)

---

## 📞 Quick Commands Reference

```bash
# Test connection
node test-db-connection.js

# Check health
curl https://laborlink.co.in/api/health

# View logs
tail -f logs/app.log

# MongoDB shell
mongosh "your-connection-string"
```
