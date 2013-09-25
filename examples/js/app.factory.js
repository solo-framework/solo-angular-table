/**
 * Создание нового Angular приложения с заданными настройками.
 * Позволяет разместить на одной странице несколько приложений.
 *
 * @param elementId ID DOM-элемента, к которому прикрепляется приложение
 * @param appName Имя приложения (главного модуля)
 * @param modules Список модулей, подключаемых к приложению
 * @constructor
 */
var AppFactory = function(elementId, appName, modules)
{
	'use strict';

	if (!modules)
		modules = [];

	var el = document.getElementById(elementId);

	angular.module(appName, modules).config([

		/**
		 * Т.к. используется Smarty, то символы {{ и }} нужно заменить,
		 * например, на <[ и ]>
		 */
		"$interpolateProvider", function($interpolateProvider){
			$interpolateProvider.startSymbol('<[');
			$interpolateProvider.endSymbol(']>');
		}
	]);
	modules.push(appName);
	angular.bootstrap(el, modules);
};