import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import * as fs from 'node:fs/promises';
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Read and parse blog data
let blogData = [];
const loadBlogData = async () => {
    try {
        const data = await fs.readFile('blogs.json', 'utf8');
        blogData = JSON.parse(data);
    } catch (error) {
        console.error("Error reading blog data:", error);
        blogData = []; // Initialize to empty array if there's an error
    }
};
await loadBlogData();

// To calculate the current date
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const d = new Date();
let mm = months[d.getMonth()];
let dd = d.getDate();
let yyyy = d.getFullYear();

app.set('view engine', 'ejs');

// Use method-override to support DELETE method in forms
app.use(methodOverride('_method'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());



// Function to generate a unique ID for blog entries
async function generateId() {
    try {
        const data = await fs.readFile("blogs.json", "utf-8");
        const existingData = JSON.parse(data);
        const lastEntry = existingData[existingData.length - 1];
        if (lastEntry) {
            return lastEntry.id + 1;
        } else {
            return 1;
        }
    } catch (error) {
        console.log("Error generating blogID:", error);
        return 1; // Return 1 if error occurs or file is empty
    }
}

// Routes
app.get("/", (req, res) => {
    res.render('index.ejs', { blogData });
});

app.get("/form", (req, res) => {
    res.render("form.ejs");
});

app.get("/blog/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const blog = blogData.find(blog => blog.id == blogId);

    if (blog) {
        res.render("blog.ejs", { blog });
    } else {
        res.status(404).send("Blog not found");
    }
});

app.get("/update/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const blog = blogData.find(blog => blog.id == blogId);

    if (blog) {
        res.render("update.ejs", { blog });
    } else {
        res.status(404).send("Blog not found");
    }
});


app.post("/submit", async (req, res) => {
    const blogTitle = req.body["title"];
    const blogMessage = req.body["message"];
    const today = dd + ' ' + mm + ' ' + yyyy;
    const blogId = await generateId();

    const newBlogEntry = {
        id: blogId, // Generate unique ID
        title: blogTitle,
        message: blogMessage,
        date: today
    };

    try {
        let existingData = [];
        // Check if the file exists
        try {
            const data = await fs.readFile("blogs.json", "utf-8");
            existingData = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // Ensure existingData is an array
        if (!Array.isArray(existingData)) {
            existingData = [];
        }

        // Append new data to existing array
        existingData.push(newBlogEntry);

        // Write updated array back to file
        await fs.writeFile("blogs.json", JSON.stringify(existingData, null, 2));

        console.log("New blog entry added successfully.");

        blogData = existingData; // Update the in-memory blogData
        res.render("index.ejs", { blogData });

    } catch (error) {
        console.error("Error adding new blog entry:", error);
    }
});

// This patch request but used post approach

app.post("/update/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const blogIndex = blogData.findIndex(blog => blog.id === blogId);

    if (blogIndex !== -1) {
        blogData[blogIndex].title = req.body.title;
        blogData[blogIndex].message = req.body.message;

        try {
            await fs.writeFile('blogs.json', JSON.stringify(blogData, null, 2));
            return res.redirect(`/blog/${blogId}`);
        } catch (error) {
            console.error("Error updating blog entry:", error);
            return res.status(500).send("Error updating blog entry");
        }
    } else {
        return res.status(404).send("Blog not found");
    }
});


// This delete function 
app.delete ("/blog/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const blogIndex = blogData.findIndex(blog => blog.id === blogId);
        if(blogIndex !==-1) {
            try{
                blogData.splice(blogIndex, 1);
                await fs.writeFile('blogs.json', JSON.stringify(blogData, null, 2));
                return res.redirect("/");
            } catch (error) {
                console.error("Error deleting blog entry:", error);
                return res.status(500).send("Error deleting blog entry");
            }
            
        } else {
            res.status(404).send("Blog not found.") 
        }

});

app.use(express.static("public"));

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
