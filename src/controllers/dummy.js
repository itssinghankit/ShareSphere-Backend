
//to create and store value of type date in mongodb
const date = new Date(); // Create a new date object with the current date and time
console.log(date);

// Save the date object to MongoDB
// Assuming you have a MongoDB connection and a collection named "dummyCollection"
dummyCollection.insertOne({ date: date }, (err, result) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Date saved to MongoDB");
    }
});