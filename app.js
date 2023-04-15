const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set ('view engine' , 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"))

mongoose.connect("mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0", {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your To-Do List"
});
const item2 = new Item({
    name: "Click the + button to add new item"
});
const item3 = new Item({
    name: "<-- Click this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listScheme = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listScheme);

      
app.get("/", function(req, res){
    Item.find({}).then(function(foundItems){
        if (foundItems.length === 0){
            Item.insertMany(defaultItems).then(function () {
                console.log("Successfully saved default items to DB");
            })
            .catch(function (err) {
                console.log(err);
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems})
        }
    });   
});



app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function(err,foundList){
        if(!err){
            if(!foundList){
                //Create a New list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            } else {
                //Show the Existing List
                res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
            }
        }
    });   
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today"){
        item.save();
        res.redirect("/");    
    } else {
        List.findOne({name: listName}).then(function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName)
        });
    }
    
});

app.post("/delete", function(req,res){
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemID).then(function(err){
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}).then(function(err, foundList){
            if (!err){
                res.redirect("/" + listName);
            }
        });
    }
});



app.listen(3000, function(){
    console.log("Server started at port 3000")
})