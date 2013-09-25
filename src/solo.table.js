/**
 * AngularJS table with filters & sorting
 */

angular.module("solo.table", [])

	.controller("SoloTableCtrl", ['$scope', '$filter', function ($scope){

		$scope.original = [];

		$scope.bindData = function(data)
		{
			$scope.original = data;
		};

		/**
		 * По этой коллекции нужно выполнять ng-repeat
		 *
		 * @type Array
		 */
		$scope.filtered = [];

		$scope.order = {
			Header: null,
			Direction: false
		};

		$scope.tableHeaders = {};

		/**
		 * Описание пейджера
		 *
		 * @type onPage: number, currentPage: number, found: number, total: Number, foundPages: number
		 */
		$scope.pager = {
			onPage: 10,
			currentPage: 1,
			found: 0,
			foundPages: 0
		};


		$scope.gotoNextPage = function()
		{
			if ($scope.pager.foundPages == $scope.pager.currentPage)
				return true;

			$scope.pager.currentPage++;
		};

		$scope.gotoFirstPage = function ()
		{
			$scope.pager.currentPage = 1;
		};

		$scope.gotoLastPage = function ()
		{
			$scope.pager.currentPage = $scope.pager.foundPages;
		};

		$scope.gotoPrevPage = function()
		{
			if ($scope.pager.currentPage == 1)
				return true;
			$scope.pager.currentPage--;
		};

		$scope.updatePager = function(filteredCount)
		{
			$scope.pager.found = filteredCount;
			$scope.pager.foundPages = Math.ceil(filteredCount / $scope.pager.onPage);
			$scope.gotoFirstPage();
		};

		$scope.$watchCollection("filtered", function (list){
			$scope.updatePager(list.length);
		});

		/**
		 * Сортировка по колонкам
		 * @param header
		 */
		$scope.orderTableBy = function(header){

			if ($scope.order.Header == header && $scope.order.Direction == false)
			{
				$scope.order.Header = null; // очистка сортировки.
			}
			else if ( $scope.order.Header == header )
			{
				$scope.order.Direction = false;
			}
			else
			{
				$scope.order.Header = header;
				$scope.order.Direction = true;
			}
		};

		$scope.ping = function()
		{
			console.log("ping");
		};

	}])

	.filter("pager", function(){
		return function(items, page, onPage)
		{
			if (items.length <= onPage)
				return items;

			var offset = (page - 1) * onPage;
			return items.slice(offset, offset + onPage);
		};
	})
	.directive("bindtabledata", function(){
		return {
			require: "?ngModel",
			restrict: "A",
			link: function (scope, elm, attrs, ngm)
			{
				//elm.hide();
				elm.css({"display" : "none"});

				var json = angular.fromJson(elm.html());
				scope.bindData(json);
			}
		};
	})
	/**
	 * Эта директива добавляет возможность сортировки колонки
	 * и добавляет в разметку стрелки, указывающие направление сортировки
	 *
	 * Пример:
	 * <tr>
	 *   <th sort-flag='id'>Id</th>
	 * </tr>
	 */
	.directive("sortFlag", function($compile){
		return {
			require: "?ngModel",
			restrict: "A",
			replace: false,
			template: function(tElement, tAttrs)
			{
				return "<strong class='solo-table-column-cursor' ng-click='orderTableBy(\""+ tAttrs.sortFlag +"\")'>" + tElement.html()+ "</strong>";

			},
			link: function (scope, elm, attrs, ngm)
			{
				if (attrs.sortFlag)
				{
					elm.append("<span class='solo-column-arrow'></span>");
					scope.tableHeaders[attrs.sortFlag] = elm;
				}
			}
		};
	})
	/**
	 * Указывает, сколько записей д.б. на странице
	 * Пример: <solo-table items-on-page = "20">
	 */
	.directive("itemsOnPage", function(){
		return {

			restrict: "A",
			compile: function (elm, attr)
			{
				if (attr.itemsOnPage !== 0 && attr.itemsOnPage)
				{
					var tr = angular.element( elm.find('tbody').children('tr')[0]);
					var repeat = tr.attr("ng-repeat");
					tr.attr("ng-repeat", repeat + " | pager:pager.currentPage:pager.onPage");
				}

				return {
					preLink: function ($scope, element, attrs, controller)
					{
						$scope.pager.onPage = attrs.itemsOnPage;
					}
				};
			}
		};
	})
	/**
	 * Директива добавляет возможность сортировки - добавляет в ng-repeat фильтр с направлениями сортировки
	 */
	.directive("makeSortable", function(){
		return {
			restrict: "A",
			compile: function (elm, attr)
			{
				// добавим возможность сортировки
				var tr = angular.element( elm.find('tbody').children('tr')[0]);
				var repeat = tr.attr("ng-repeat");
				tr.attr("ng-repeat", repeat + " | orderBy:order.Header:order.Direction");

				// следим за изменениями сортировки
				return {
					pre: function preLink(scope, elm, attrs)
					{
						scope.$watchCollection("order", function(){

							var resetClasses = function()
							{
								for (var i in scope.tableHeaders)
								{
									scope.tableHeaders[i].removeClass("solo-table-sort-asc");
									scope.tableHeaders[i].removeClass("solo-table-sort-desc");
								}
							};

							if (scope.order.Header == null && scope.order.Direction == false)
							{
								resetClasses();
							}
							else if (scope.order.Header)
							{
								var el = scope.tableHeaders[scope.order.Header];
								if (!el)
									return;
								if (scope.order.Direction)
								{

									resetClasses();
									el.addClass("solo-table-sort-asc");
								}
								else
								{
									resetClasses();
									el.addClass("solo-table-sort-desc");
								}
							}

						});
					}
				};
			}
		};
	})
	/**
	 * Базовая директива
	 *
	 * <solo-table make-sortable items-on-page = "15">
	 *     ...
	 * </solo-table>
	 */
	.directive("soloTable", function(){
		return {
			require: "?ngModel",
			restrict: "E",
			controller: "SoloTableCtrl"
		};
	})

	/**
	 * Фильтрация только по указанным полям
	 *
	 * @example <tr ng-repeat="item in filtered = (original | filterByFields:filter:['id', 'login', 'name']">
	 */
	.filter("filterByFields", function(){
		/**
		 * @param items - Список фильтруемых записей
		 * @param search - Искомая подстрока
		 * @param items - список имен полей, по которым идет поиск
		 */
		return function (items, search, fields)
		{
			if (!search)
				return items;

			if (fields.length == 0)
				throw Error("You have to define list of fields");

			var test = function(el, idx, array)
			{
				var compare = function(val, search)
				{
					search = (''+search).toLowerCase();
					return (''+val).toLowerCase().indexOf(search) !== -1;
				};

				var result = false;
				for (var i = 0; i < fields.length; i++)
				{
					if (compare(el[fields[i]], search))
					{
						result = true;
						break;
					}
				}
				return result;
			};

			return items.filter(test);
		};
	});

