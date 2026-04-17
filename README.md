# WebCW
Web development coursework 2.
A website for a local yoga studio which allows users to book entire courses or single sessions, and organisers to create courses and edit user accounts.

# Instructions for running site
* Required software: Visual Studio Code, node.js with NPM

1. Download the application (via zip file or cloning the repository) and open in VS Code.
2. Run node.js using its executable.
3. Open a Command Prompt terminal and run "npm install" to install all dependencies.
4. Run "node seed/seed.js" to populate the databases with demo data.
5. Run "node index" to start the site. You can access the site at http://localhost:3000.

When the databases are seeded with demo data, the following account credentials will be created which can be used to test the system:

*Student account:*
* Username: fiona@student.local
* Password: password123

*Organiser account:*
* Username: organiser@yoga.local
* Password: password123

# List of implemented features

*All users, including unregistered users can:*
* View the homepage
* View a list of courses
* Filter the course list
* View the details of a specific course, including: the name, description, location, duration, skill level, price and start and end dates of the course; and a list of each session of the course, showing each session's start and end time and dates, location, maximum capacity, number of booked attendees and remaining space.

*Once logged in, registered student users can:*
* Book attendance on a whole course, and/or single sessions of a course if the course allows drop-in sessions

*Once logged in, registered organiser users can:*
* Create new courses
* Add sessions to courses
* View a list of all accounts booked on a specific session
* Edit the details of an existing course or session
* Delete a course or session (Deleting a course deletes all its sessions)
* Create new user accounts
* Change the role of existing accounts between student and organiser (cannot remove organiser status from own account) 
* Delete existing user accounts (Cannot delete own account)