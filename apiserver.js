const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

// Create the app and define the port
const app = express();
const port = 3000;

// Middleware to handle JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB URI and client initialization
const uri = "mongodb+srv://upendra:upendra0518@mealplanner.jwkd0.mongodb.net/?retryWrites=true&w=majority&appName=MealPlanner";
const client = new MongoClient(uri);

// Declare database and collection variables
let db, userCollection, mealCollection;

// Function to initialize the database
async function initializeDatabase() {
    try {
        await client.connect();
        db = client.db('MealPlanner');
        userCollection = db.collection('User');
        mealCollection = db.collection('Meals');
        recipeCollection = db.collection('Recipes');
        console.log("Database connected successfully!");
    } catch (err) {
        console.error('Failed to connect to the database', err);
    }
}

// Middleware to check if the database is initialized
app.use((req, res, next) => {
    if (!db) {
        return res.status(500).send('Database not initialized');
    }
    req.db = db;
    next();
});

// Route to test the database connection
app.get('/', (req, res) => {
    res.send('Database is connected and initialized');
});

// Route to handle user login (verifyUser)
app.post('/verifyUser', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userCollection.findOne({ email, password });

        // Check if the user exists and return the appropriate response
        if (user) {
            res.status(200).send([user]);  // Send user data if found
        } else {
            res.status(401).send({ message: 'Invalid credentials' });  // Send error message for invalid credentials
        }
    } catch (err) {
        console.error('Error verifying user:', err);
        res.status(500).send('Error verifying user');
    }
});


// Route to handle user registration (signup)
app.post('/registerUser', async (req, res) => {
  const userData = req.body;

  try {
      const existingUser = await userCollection.findOne({ email: userData.email });
      if (existingUser) {
          return res.status(400).send({ message: 'User already exists' });
      }

      const result = await userCollection.insertOne(userData);
      res.status(201).send({ success: true, userId: result.insertedId });
  } catch (err) {
      res.status(500).send('Error registering user');
  }
});

// Route to get meals by user ID
app.post('/getMealsByUser', async (req, res) => {
    const { userId } = req.body;

    try {
        const meals = await mealCollection.find({ userId: new ObjectId(userId) }).toArray();
        if (meals.length > 0) {
            res.status(200).json(meals);
        } else {
            res.status(404).send({ message: 'No meals found for this user' });
        }
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send({ error: 'Error fetching meals' });
    }
});

// Fetch all meals
app.get('/getMeals', async (req, res) => {
  try {
      const meals = await mealCollection.find({}).toArray();  // Fetch all meals
      res.status(200).json(meals);  // Return meals as JSON
  } catch (error) {
      console.error("Error fetching meals: ", error);
      res.status(500).json({ error: "Error fetching meals" });
  }
});

// Get meal details by ID
app.get('/getMealDetails/:id', async (req, res) => {
  const mealId = req.params.id;

  try {
      const meal = await mealCollection.findOne({ _id: new ObjectId(mealId) });
      if (meal) {
          res.status(200).json(meal);
      } else {
          res.status(404).send({ error: 'Meal not found' });
      }
  } catch (error) {
      console.error("Error fetching meal details: ", error);
      res.status(500).send({ error: 'Error fetching meal details' });
  }
});

// Route to add a new meal
app.post('/addMeal', (req, res) => {
    const { mealName, mealDate, mealDescription, mealCalories, proteins, fats, carbs, ingredients, userId } = req.body;

    // Convert string fields to integers where appropriate
    const mealData = {
        mealName,
        mealDate,
        mealDescription,
        mealCalories: parseInt(mealCalories, 10),
        proteins: parseInt(proteins, 10),
        fats: parseInt(fats, 10),
        carbs: parseInt(carbs, 10),
        ingredients,
        userId: new ObjectId(userId)  
    };

    mealCollection.insertOne(mealData)
        .then(result => res.status(201).send({ success: true, mealId: result.insertedId }))
        .catch(err => res.status(500).send('Error adding meal'));
});


app.get('/getRecipes', async (req, res) => {
  try {
      const recipes = await recipeCollection.find({}).toArray();  // Fetch all recipes
      res.status(200).json(recipes);  // Return recipes as JSON
  } catch (error) {
      console.error("Error fetching recipes: ", error);
      res.status(500).json({ error: "Error fetching recipes" });
  }
});

// Start the server and initialize the database
app.listen(port, async () => {
    console.log(`Meal Planner server is running on http://localhost:${port}`);
    await initializeDatabase();
});
