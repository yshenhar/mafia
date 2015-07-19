var users = [];

process.on("message", function(data){
  if (data.type === "create"){
    users = data.users;

    console.log("Game started with users: " + JSON.stringify(users))
  }
});
