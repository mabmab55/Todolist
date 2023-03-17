require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch((err) => console.log(err));
async function main() {
  await mongoose
    .connect(process.env.MONGODB_TOKEN, {})
    .then(() => console.log("database connected")).catch((err) => {
      console.log(err + " Check the DB key")
    });
}

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
//creating mongoose model, singular collection name (item) and schema name
const Item = mongoose.model("Item", itemSchema);

const study = new Item({
  name: "Study",
});

const gym = new Item({
  name: "Go to the gym",
});

const lunch = new Item({
  name: "Eat lunch",
});
const defaultItems = [study, gym, lunch];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then((items) => {
      //if to check if the database is empty or not, to not keep adding the default items again and again in the DB
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then((res) => {
            console.log("Success to add default items");
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/");
      }
      res.render("list", { listTitle: "Today", newListItems: items });
      //console.log(items);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  //console.log(req.body);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId })
      .then((response) => {
        console.log(response.deletedCount);
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((items) => {
        console.log(items);
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/:listTitle", (req, res) => {
  const title = _.capitalize(req.params.listTitle);
  //res.render("list", {listTitle: title, newListItems: items})
  List.findOne({ name: title })
    .then((foundList) => {
      if (!foundList) {
        console.log("list doesnt exist");
        //create a new list
        const list = new List({
          name: title,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + title);
      } else {
        console.log("list exist");
        res.render("list", { listTitle: title, newListItems: foundList.items });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
