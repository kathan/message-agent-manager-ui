var DUApp = angular.module("DUApp",[]);

DUApp.controller('DUCtrl', function ($scope, $http, $rootScope){
  var du = DropUpload({targetElement: '#du', hoverClass: 'my-class'});
  
  $scope.upload = function(){
    /*************************************************
     * Change the value of my_url to set it in action
     *************************************************/
     var my_url = 'http://qaxstbap001.qa2-sap.grainger.com/message-agent-manager-ui/api.njs/409/409%20-%20Preflight%20Images';
    du.upload(my_url, function(e) {
      var i = 0;
    });
  }
  
  du.addEventListener('files-dropped', function(e) {
    /************************************************
     * e.detail contains an array of the files that were dropped.
     *************************************************/
    $scope.files = e.detail;
    $scope.$apply();
  });
  
  du.addEventListener('progress', function(e) {
    /*************************************************
     * Each file has a progress property that is updated,
     * which is being used in the Angular template to set 
     * the width of the progress bar.
     * Since the list of files is in $scope.files,
     * all that needs to be done is to call $scope.$apply.
     **************************************************/
    $scope.$apply();
  });
  
  du.addEventListener('error', function(e) {
    $('#debug').text('Some bad stuff happened');
  });
});
