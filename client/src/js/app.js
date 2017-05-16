var angular = require('angular');

// WGo
// TODO: Is it worth abstracting this into its own module?
require('./lib/wgo/wgo.js');
require('./lib/wgo/kifu.js');
require('./lib/wgo/sgfparser.js');
require('./lib/wgo/player.js');
require('./lib/wgo/basicplayer.js');
require('./lib/wgo/basicplayer.component.js');
require('./lib/wgo/basicplayer.infobox.js');
// require('./lib/wgo/basicplayer.commentbox.js');
require('./lib/wgo/basicplayer.control.js');
require('./lib/wgo/player.editable.js');
require('./lib/wgo/scoremode.js');
require('./lib/wgo/player.permalink.js');

// GoKibitz WGo files
require('./wgo/gokibitz.wgo.js');

var gokibitz = angular.module('gokibitz', [
	'gokibitz.controllers',
	'gokibitz.directives',
	'gokibitz.services',
	'gokibitz.filters',
	'ui.router',
	'ui.bootstrap',
	'ui.bootstrap.tpls',
	'ngCookies',
	'ngResource',
	'ngSanitize',
	'ngRoute',
	'ngAnimate',
	'ngTouch',
	'http-auth-interceptor',
	'angularFileUpload',
	'ui.utils',
	'angular-locker',
	'720kb.socialshare',
	'flatui.directives',
	'duScroll',
	'btford.socket-io',
	'cfp.hotkeys',
	'infinite-scroll',
	'monospaced.elastic'
]);

require('angular-ui-router');
require('angular-animate');
require('angular-route');
require('angular-file-upload');
require('angular-cookies');
require('angular-resource');
require('angular-sanitize');
require('angular-touch');
require('http-auth-interceptor');
require('ui-bootstrap-tpls');
require('ui-bootstrap');
require('ui-utils');
require('angular-scroll');
require('angular-socket-io');
require('angular-locker');
require('angular-hotkeys');
require('angular-elastic');

// Third-party share button directive
// @see https://github.com/720kb/angular-socialshare
require('./lib/angular-socialshare.js');

require('./lib/sticky.js');

// @see https://gist.github.com/cirqueit/b668f464a80ad5c8ca0b
require('./lib/flatui.directives.js');

require('./lib/ng-infinite-scroll.js');

angular.module('gokibitz.controllers', []);
angular.module('gokibitz.directives', []);
angular.module('gokibitz.services', []);
angular.module('gokibitz.filters', []);
require('./controllers/*.js', { mode: 'expand' });
require('./directives/*.js', { mode: 'expand' });
require('./services/*.js', { mode: 'expand' });
require('./filters/*.js', { mode: 'expand' });

gokibitz.config(
	function ($qProvider, $routeProvider, $locationProvider, lockerProvider) {
		$routeProvider
			.when('/', {
				templateUrl: '/partials/index',
				controller: 'IndexController',
				resolve: {
					//  Just for old-times sake: we're no longer using a kifu on the homepage
					// kifu: function ($http) {
					//	return $http.get('/api/kifu', {
					//		params: {
					//			limit: 1
					//		}
					//	});
					// }
				}
			})
			.when('/login', {
				templateUrl: '/partials/index',
				controller: 'IndexWithModalController',
				resolve: {
					modal: () => 'login'
				}
			})
			.when('/reset-password/:username/:token', {
				templateUrl: '/partials/index',
				controller: 'IndexWithModalController',
				resolve: {
					modal: () => 'resetPassword'
				}
			})
			.when('/notifications', {
				templateUrl: '/partials/notifications',
				controller: 'NotificationsController'
			})
			.when('/admin', {
				templateUrl: '/partials/admin',
				controller: 'AdminController'
			})
			.when('/upload', {
				templateUrl: '/partials/upload',
				controller: 'UploadController'
			})
			.when('/fetch', {
				templateUrl: '/partials/fetch',
				controller: 'FetchController'
			})
			.when('/kifu', {
				templateUrl: '/partials/list-kifu',
				controller: 'ListKifuController',
				resolve: {
					settings: function (Settings, $rootScope) {
						if (!$rootScope.currentUser) {
							return;
						}

						var SettingsData = Settings.get({
							keys: ['listKifuToggle']
						});

						return SettingsData.$promise;
					}
				}
			})
			.when('/kifu/:shortid', {
				templateUrl: '/partials/kifu',
				controller: 'KifuController',
				reloadOnSearch: false,
				resolve: {
					kifu: function ($http, $route) {
						var shortid = $route.current.params.shortid;
						return $http.get('/api/kifu/' + shortid);
					}
				}
			})
			.when('/user/:username', {
				templateUrl: '/partials/user',
				controller: 'UserController',
				resolve: {
					user: function ($http, $route) {
						var username = $route.current.params.username;
						return $http.get('/api/user/' + username);
					}
				}
			})
			.otherwise({
				redirectTo: '/'
			});

			$locationProvider.html5Mode(true);

			lockerProvider
				.setDefaultDriver('local')
				.setDefaultNamespace('gokibitz')
				.setSeparator('.')
				.setEventsEnabled('true');

			// @see https://github.com/angular-ui/ui-router/issues/2889
			$qProvider.errorOnUnhandledRejections(false);
		}
	);

	/*
	gokibitz.config([
	'$httpProvider',
	function ($httpProvider) {
	$httpProvider.interceptors.push([
	'$injector',
	function ($injector) {
	return $injector.get('AuthInterceptor');
}
]);
}
]);
*/

gokibitz.run(
	function ($rootScope, $location, Auth, $route, $window) {
		// Check to see if we're in an iframe
		$rootScope.iframed = ($window.self !== $window.top);

		$rootScope.$on('$routeChangeSuccess', function () {
			// Reset the page's title on ever route change
			// Better to the title blank than wrong
			$rootScope.pageTitle = '';
		});

		// watching the value of the currentUser variable.
		$rootScope.$watch('currentUser', function (currentUser) {
			// if no currentUser and on a page that requires authorization then try to update it
			// will trigger 401s if user does not have a valid session
			var path = $location.path().split('/');
			path = '/' + path[1];

			if (
				!currentUser &&
				!~['/', '/login', '/logout', '/reset-password', '/signup', '/kifu', '/user'].indexOf(path)
			) {
				Auth.currentUser();
			}
		});

		// On catching 401 errors, redirect to the login page.
		$rootScope.$on('event:auth-loginRequired', function ($event, rejection, $rootScope) {
			$rootScope.redirectOnAuth = $location.path();
			$location.path('/login');
			return false;
		});
	}
);
