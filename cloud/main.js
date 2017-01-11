Parse.Cloud.job("userChangePermission", function(request, status) {
  Parse.Cloud.useMasterKey();
  var counter = 0;
  var query = new Parse.Query(Parse.User);
  query.doesNotExist("isPermissionUpdated");
  query.count().then(function(number) {
    console.log("Start job 'userChangePermission'. Left " + number + " users");

    var query2 = new Parse.Query(Parse.User);
    query2.doesNotExist("isPermissionUpdated");
    query2.each(function(user) {
      var acl = new Parse.ACL(user);
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      acl.setWriteAccess(user.id, true);
      acl.setReadAccess(user.id, true);
      user.setACL(acl);
      user.set("isPermissionUpdated", true);
      if (counter % 1000 === 0) {
        status.message(counter + " users processed.");
      }
      counter += 1;
      return user.save();
    }).then(function() {
      status.success("Completed successfully");
    }, function(error) {
      status.error(error.message);
    });
  });
});

Parse.Cloud.job("countNotUpdatedUsers", function(request, status) {
  Parse.Cloud.useMasterKey();
  var count = 0;
  var query = new Parse.Query(Parse.User);
  query.doesNotExist("isPermissionUpdated");
  query.count().then(function(number) {
    count = number;
    var query2 = new Parse.Query(Parse.User);
    query2.equalTo("isPermissionUpdated", false);
    return query2.count();
  }).then(function(number) {
    count += number;
    status.success("number: " + count);
  });
});

Parse.Cloud.define("usersWithFbId", function(request, response) {
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.User);
  query.containedIn("fbId", request.params.fbIds)
  query.find({
  	success: function(results) {
  		var returnData = [];
  		for (var i = 0; i < results.length; i++) {
  			var user = results[i];
  			if (user.get("authData") != undefined) {
  				var data = {
  				"objectId": user.id,
  				"fbId": user.get("authData")["facebook"]["id"]
  			};
  			returnData.push(data);
  			};
  		};
    	response.success(returnData);
   	},
    error: function() {
    	response.error("users lookup failed");
    }
  });
});

Parse.Cloud.define("tagsWithUserId", function(request, response) {
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query("Tags");
  query.equalTo("userId", request.params.userId);
  query.ascending("appId")
  query.find({
  	success: function(results) {
  		var i = 0;
  	var j = 0;
	while(i < results.length) {
  			var tag1 = results[i];
  			j = i + 1;
  			while (j < results.length) {
  				var tag2 = results[j];
  				if (tag1.get("appId") === tag2.get("appId")) {
  					results.splice(j, 1);
  					i = -1;
  					break;
  				}
  				j++;
  			} 
  			i++;
  		}


  		var returnData = [];
  		for (var i = 0; i < results.length; i++) {
  			var tag = results[i];
  			var data = {
  				"own": tag.get("own"),
  				"want": tag.get("want"),
  				"appId": tag.get("appId")
  			};
  			returnData.push(data);
  		};
    	response.success(returnData);
   	},
    error: function() {
    	response.error("tags lookup failed");
    }
  });
});
