const readline = require("readline");
const fs = require("fs");
const DATA_FILE = "employees.json";
function loadEmployees() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return [];
}
function saveEmployees(employees) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2));
}
let employees = loadEmployees();
let nextId = employees.length ? Math.max(...employees.map((e) => e.id)) + 1 : 1;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}
function validateName(name) { return name.trim().length >= 2; }
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
function validateSalary(salary) { const num = parseFloat(salary); return !isNaN(num) && num > 0; }
function validateDepartment(dept) { return dept.trim().length >= 2; }
async function addEmployee() {
  console.log("\n--- Add New Employee ---");
  let name = await ask("Name: ");
  while (!validateName(name)) { console.log("Invalid name."); name = await ask("Name: "); }
  let email = await ask("Email: ");
  while (!validateEmail(email)) { console.log("Invalid email."); email = await ask("Email: "); }
  if (employees.find((e) => e.email === email.trim())) { console.log("Email already exists."); return; }
  let department = await ask("Department: ");
  while (!validateDepartment(department)) { console.log("Invalid department."); department = await ask("Department: "); }
  let salary = await ask("Salary: ");
  while (!validateSalary(salary)) { console.log("Invalid salary."); salary = await ask("Salary: "); }
  const employee = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    department: department.trim(),
    salary: parseFloat(salary),
    createdAt: new Date().toISOString(),
  };
  employees.push(employee);
  saveEmployees(employees);
  console.log(`Employee added with ID: ${employee.id}`);
}
function listEmployees() {
  console.log("\n--- Employee List ---");
  if (employees.length === 0) { console.log("No employees found."); return; }
  employees.forEach((e) => {
    console.log(`[${e.id}] ${e.name} | ${e.email} | ${e.department} | Salary: ${e.salary}`);
  });
}
async function searchEmployee() {
  console.log("\n--- Search Employee ---");
  const query = await ask("Enter name or email: ");
  const results = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.email.toLowerCase().includes(query.toLowerCase())
  );
  if (results.length === 0) { console.log("No matching employees found."); return; }
  results.forEach((e) => {
    console.log(`\nID: ${e.id}\nName: ${e.name}\nEmail: ${e.email}\nDept: ${e.department}\nSalary: ${e.salary}\nJoined: ${e.createdAt}`);
  });
}
async function updateEmployee() {
  console.log("\n--- Update Employee ---");
  const idStr = await ask("Enter Employee ID to update: ");
  const id = parseInt(idStr);
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) { console.log("Employee not found."); return; }
  const emp = employees[index];
  console.log(`Editing: ${emp.name} — leave blank to keep current value`);
  const name = await ask(`Name [${emp.name}]: `);
  const email = await ask(`Email [${emp.email}]: `);
  const department = await ask(`Department [${emp.department}]: `);
  const salary = await ask(`Salary [${emp.salary}]: `);
  if (name.trim() && !validateName(name)) { console.log("Invalid name."); return; }
  if (email.trim() && !validateEmail(email)) { console.log("Invalid email."); return; }
  if (salary.trim() && !validateSalary(salary)) { console.log("Invalid salary."); return; }
  employees[index] = {
    ...emp,
    name: name.trim() || emp.name,
    email: email.trim() || emp.email,
    department: department.trim() || emp.department,
    salary: salary.trim() ? parseFloat(salary) : emp.salary,
    updatedAt: new Date().toISOString(),
  };
  saveEmployees(employees);
  console.log("Employee updated.");
}
async function deleteEmployee() {
  console.log("\n--- Delete Employee ---");
  const idStr = await ask("Enter Employee ID to delete: ");
  const id = parseInt(idStr);
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) { console.log("Employee not found."); return; }
  const confirm = await ask(`Delete ${employees[index].name}? (yes/no): `);
  if (confirm.toLowerCase() === "yes") {
    employees.splice(index, 1);
    saveEmployees(employees);
    console.log("Employee deleted.");
  } else {
    console.log("Cancelled.");
  }
}
function showStats() {
  if (employees.length === 0) { console.log("\nNo data available."); return; }
  const depts = {};
  employees.forEach((e) => { depts[e.department] = (depts[e.department] || 0) + 1; });
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = totalSalary / employees.length;
  console.log(`\n--- Stats ---`);
  console.log(`Total Employees: ${employees.length}`);
  console.log(`Total Salary: ${totalSalary}`);
  console.log(`Average Salary: ${avgSalary.toFixed(2)}`);
  console.log(`Departments:`);
  Object.entries(depts).forEach(([d, count]) => console.log(`  ${d}: ${count}`));
}
async function mainMenu() {
  while (true) {
    console.log(`
============================
  Employee Management CLI
============================
1. Add Employee
2. List All Employees
3. Search Employee
4. Update Employee
5. Delete Employee
6. Stats
7. Exit
============================`);
    const choice = await ask("Choose an option: ");
    switch (choice.trim()) {
      case "1": await addEmployee(); break;
      case "2": listEmployees(); break;
      case "3": await searchEmployee(); break;
      case "4": await updateEmployee(); break;
      case "5": await deleteEmployee(); break;
      case "6": showStats(); break;
      case "7":
        console.log("Goodbye!");
        rl.close();
        process.exit(0);
      default:
        console.log("Invalid option. Try 1-7.");
    }
  }
}
mainMenu();