var gulp = require("gulp");
var browserify = require("browserify");
var fs = require("fs");

var paths = {
  scripts: ['src/**/*.js', 'src/**/*.jsx', '!.#**']
};

gulp.task("default", function () {

  browserify("./src/app.js")
              .transform("babelify", {presets: ["es2015", "react"]})
              .bundle()
              .pipe(fs.createWriteStream("../../static/app.js"));
  

});

gulp.task("watch", function() {
  gulp.watch(paths.scripts, ["default"]);
});
