var gulp = require('gulp'),
  connect = require('gulp-connect');
 


gulp.task('serve', function() {
  connect.server({
  	root: 'public'
  });
});
 
gulp.task('default', ['serve']);