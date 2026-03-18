const http = require("http");
const url = require("url");

let students = []; // in-memory storage

// Helper: Send JSON response
function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// Helper: Validate student
function validateStudent(student) {
  const { name, email, course, year } = student;

  if (!name || !email || !course || !year) {
    return "All fields are required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  if (year < 1 || year > 4) {
    return "Year must be between 1 and 4";
  }

  return null;
}

// Helper: Generate ID
function generateId() {
  return Date.now().toString();
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // ROUTE: /students
  if (path === "/students" && method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const error = validateStudent(data);
        if (error) {
          return sendResponse(res, 400, {
            success: false,
            message: error
          });
        }

        const newStudent = {
          id: generateId(),
          ...data
        };

        students.push(newStudent);

        sendResponse(res, 201, {
          success: true,
          data: newStudent
        });

      } catch {
        sendResponse(res, 400, {
          success: false,
          message: "Invalid JSON"
        });
      }
    });
  }

  // GET ALL STUDENTS
  else if (path === "/students" && method === "GET") {
    sendResponse(res, 200, {
      success: true,
      data: students
    });
  }

  // GET /students/:id
  else if (path.startsWith("/students/") && method === "GET") {
    const id = path.split("/")[2];
    const student = students.find(s => s.id === id);

    if (!student) {
      return sendResponse(res, 404, {
        success: false,
        message: "Student not found"
      });
    }

    sendResponse(res, 200, {
      success: true,
      data: student
    });
  }

  // PUT /students/:id
  else if (path.startsWith("/students/") && method === "PUT") {
    const id = path.split("/")[2];
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const error = validateStudent(data);
        if (error) {
          return sendResponse(res, 400, {
            success: false,
            message: error
          });
        }

        const index = students.findIndex(s => s.id === id);

        if (index === -1) {
          return sendResponse(res, 404, {
            success: false,
            message: "Student not found"
          });
        }

        students[index] = { id, ...data };

        sendResponse(res, 200, {
          success: true,
          data: students[index]
        });

      } catch {
        sendResponse(res, 400, {
          success: false,
          message: "Invalid JSON"
        });
      }
    });
  }

  // DELETE /students/:id
  else if (path.startsWith("/students/") && method === "DELETE") {
    const id = path.split("/")[2];

    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
      return sendResponse(res, 404, {
        success: false,
        message: "Student not found"
      });
    }

    students.splice(index, 1);

    sendResponse(res, 200, {
      success: true,
      message: "Student deleted successfully"
    });
  }

  // 404 ROUTE
  else {
    sendResponse(res, 404, {
      success: false,
      message: "Route not found"
    });
  }
});

// START SERVER
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});