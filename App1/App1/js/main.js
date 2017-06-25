// Основные сведения о пустом шаблоне см. в следующей документации:
// http://go.microsoft.com/fwlink/?LinkId=232509

(function () {
	"use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;
	var isFirstActivation = true;

    WinJS.log = console.log.bind(console);


	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.voiceCommand) {
			// TODO: обработка соответствующих ActivationKinds. Например, если приложение можно запускать с помощью голосовых команд,
			// здесь удобно указать, требуется ли заполнить поле ввода или выбрать другое начальное представление.
		}
		else if (args.detail.kind === activation.ActivationKind.launch) {
			// Активация Launch выполняется, когда пользователь запускает ваше приложение с помощью плитки
		    // или вызывает всплывающее уведомление, щелкнув основной текст или коснувшись его.
		    WinJS.Utilities.startLog();
		    WinJS.log && WinJS.log("createLibrary Enter", "custom", "info");


		    console.log("1");
		    console.log("1");
		    console.log("1");

		   if (args.detail.arguments) {
				// TODO: если приложение поддерживает всплывающие уведомления, используйте это значение из полезных данных всплывающего уведомления, чтобы определить, в какую часть приложения
				// перенаправить пользователя после вызова им всплывающего уведомления.
			}
			else if (args.detail.previousExecutionState === activation.ApplicationExecutionState.terminated) {
				// TODO: это приложение было приостановлено и затем завершено для освобождения памяти.
				// Для удобства пользователей восстановите здесь состояние приложения, как будто приложение никогда не прекращало работу.
				// Примечание. Вам может потребоваться записать время последней приостановки приложения и только восстанавливать состояние в случае возвращения через небольшой промежуток времени.
			}
		}

		if (!args.detail.prelaunchActivated) {
			// TODO: значение true параметра prelaunchActivated означает, что приложение было предварительно запущено в фоновом режиме в целях оптимизации.
			// В этом случае оно было бы приостановлено вскоре после этого.
			// Долговременные операции (например, ресурсоемкие операции с сетью или дисковым вводом-выводом) или изменения пользовательской среды, возникающие при запуске,
			// должны выполняться здесь (чтобы предотвратить их выполнение при предварительном запуске).
			// Кроме того, эту работу можно выполнить в обработчике resume или visibilitychanged.
		}

		if (isFirstActivation) {
			// TODO: приложение было активировано и не выполнялось. Выполните здесь общую инициализацию запуска.
			document.addEventListener("visibilitychange", onVisibilityChanged);
			args.setPromise(WinJS.UI.processAll().then(function () { console.log("processAll then"); }));
			console.log("1");
			WinJS.log && WinJS.log("createLibrary Enter", "custom", "info");
		}

		isFirstActivation = false;
	};

	function onVisibilityChanged(args) {
		if (!document.hidden) {
			// TODO: приложение только что стало видимым. Это может оказаться подходящим моментом для обновления представления.
		}
	}

	app.oncheckpoint = function (args) {
		// TODO: действие приложения будет приостановлено. Сохраните здесь все состояния, которые понадобятся после приостановки.
		// Вы можете использовать объект WinJS.Application.sessionState, который автоматически сохраняется и восстанавливается после приостановки.
		// Если вам нужно завершить асинхронную операцию до того, как действие приложения будет приостановлено, вызовите args.setPromise().
	};

	app.start();

})();
