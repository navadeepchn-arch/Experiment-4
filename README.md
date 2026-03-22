# Experiment 4

## Title
Club all the experiments in Experiment 4 as a single experiment.

## Description
This project implements a Node.js backend experiment dashboard using HTML, CSS, and vanilla JavaScript. The dashboard serves as a launcher for three separate experiments:
1. **Experiment 4.1 – CLI Employee Management System**
2. **Experiment 4.2 – REST API for Playing Card Collection**
3. **Experiment 4.3 – Concurrent Ticket Booking System**

The dashboard simulates the backend functionality of each experiment in the browser. Each experiment runs independently with its own logic demonstrating core Node.js, Express.js, and Redis concepts.

## Learning Outcomes
- Build a command-line application using Node.js with file-based data persistence.
- Implement CRUD operations and input validation in a CLI environment.
- Design and develop RESTful APIs using Express.js with proper HTTP methods and status codes.
- Integrate Redis as an in-memory data store for concurrent seat locking using atomic Lua scripts.
- Prevent race conditions in concurrent environments using Redis TTL-based locks.
- Test REST APIs using Postman with GET, POST, PUT, PATCH, and DELETE requests.
- Prepare submission-ready structured backend projects for lab and viva.

## Tech Stack
- Node.js 18+
- Express.js
- Redis
- HTML5
- CSS3
- JavaScript (Vanilla)

## Demo URL
[https://25bcc80001-experiment4.netlify.app/]

## How to Run Locally

### Experiment 4.1 – CLI Employee Management
```bash
cd exp4.1
node employee.js
```

### Experiment 4.2 – REST API Card Collection
```bash
cd exp4.2
npm install
node server.js
```
Test endpoints at `http://localhost:3000` using Postman.

### Experiment 4.3 – Concurrent Ticket Booking
```bash
cd exp4.3
npm install
node server.js
```
Test endpoints at `http://localhost:3000` using Postman.

> Make sure Redis is running before starting Experiment 4.3.
> Start Redis: open terminal and run `redis-server`

## GitHub Repository
[https://github.com/navadeepchn-arch/Experiment-4]