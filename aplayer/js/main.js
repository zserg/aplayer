
// Основные сведения о пустом шаблоне см. в следующей документации:
// http://go.microsoft.com/fwlink/?LinkId=232509

(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var isFirstActivation = true;
    var systemMediaControls = null;
    var audtag = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.voiceCommand) {
            // TODO: обработка соответствующих ActivationKinds. Например, если приложение можно запускать с помощью голосовых команд,
            // здесь удобно указать, требуется ли заполнить поле ввода или выбрать другое начальное представление.
        }
        else if (args.detail.kind === activation.ActivationKind.launch) {
            // Активация Launch выполняется, когда пользователь запускает ваше приложение с помощью плитки
            // или вызывает всплывающее уведомление, щелкнув основной текст или коснувшись его.
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
            args.setPromise(WinJS.UI.processAll());

            // Add your code to retrieve the button and register the event handler.
            var helloButton = document.getElementById("button1");
            helloButton.addEventListener("click", doSomething5, false);

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

   

    function doSomething5() {

        var openPicker = new Windows.Storage.Pickers.FileOpenPicker();
        openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.musicLibrary;
        openPicker.fileTypeFilter.replaceAll([".mp3", ".mp4", ".m4a", ".wma", ".wav"]);
        openPicker.pickSingleFileAsync().done(function (file) {
            if (file) {
                // Create the media control.

                systemMediaControls = Windows.Media.SystemMediaTransportControls.getForCurrentView();

                // Add event listeners for PBM notifications to illustrate app is
                // getting a new SoundLevel and pass the audio tag along to the function

                systemMediaControls.addEventListener("propertychanged", mediaPropertyChanged, false);

                // Add event listener for the mandatory media commands and enable them.
                // These are necessary to play streams of type 'backgroundCapableMedia'
                systemMediaControls.addEventListener("buttonpressed", mediaButtonPressed, false);
                systemMediaControls.isPlayEnabled = true;
                systemMediaControls.isPauseEnabled = true;

                var fileLocation = window.URL.createObjectURL(file, { oneTimeOnly: true });

                if (!audtag) {
                    audtag = document.createElement('audio');
                    audtag.setAttribute("id", "audtag");
                    //audtag.setAttribute("controls", "false");
                    audtag.setAttribute("msAudioCategory", "Meda");
                    audtag.setAttribute("src", fileLocation);
                    audtag.addEventListener("playing", audioPlaying, false);
                    audtag.addEventListener("pause", audioPaused, false);
                    document.getElementById("MediaElement").appendChild(audtag);
                    audtag.load();
                    WinJS.log && WinJS.log("Audio Tag Loaded", "sample", "status");
                    log(getTimeStampedMessage("test"));
                }

            } else {
                WinJS.log && WinJS.log("Audio Tag Did Not Load Properly", "sample", "error");
            }

        });
    }

    function mediaButtonPressed(e) {
        switch (e.button) {
            case Windows.Media.SystemMediaTransportControlsButton.play:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                audtag.play();
                break;

            case Windows.Media.SystemMediaTransportControlsButton.pause:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                audtag.pause();
                break;

            default:
                break;
        }
    }

    function mediaPropertyChanged(e) {
        switch (e.property) {
            case Windows.Media.SystemMediaTransportControlsProperty.soundLevel:
                //Catch SoundLevel notifications and determine SoundLevel state.  If it's muted, we'll pause the player.
                var soundLevel = e.target.soundLevel;

                switch (soundLevel) {

                    case Windows.Media.SoundLevel.muted:
                        log(getTimeStampedMessage("App sound level is: Muted"));
                        break;
                    case Windows.Media.SoundLevel.low:
                        log(getTimeStampedMessage("App sound level is: Low"));
                        break;
                    case Windows.Media.SoundLevel.full:
                        log(getTimeStampedMessage("App sound level is: Full"));
                        break;
                }

                appMuted();
                break;

            default:
                break;
        }
    }

    function audioPlaying() {
        systemMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.playing;
    }

    function audioPaused() {
        systemMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
    }

    function appMuted() {

        if (audtag) {
            if (!audtag.paused) {
                audtag.pause();
                WinJS.log && WinJS.log("Audio Paused", "sample", "status");
            }
        }
    }

    function log(msg) {
        var pTag = document.createElement("p");
        pTag.innerHTML = msg;
        document.getElementById("StatusOutput").appendChild(pTag);
    }

    function getTimeStampedMessage(eventCalled) {
        var timeformat = new Windows.Globalization.DateTimeFormatting.DateTimeFormatter("longtime");
        var time = timeformat.format(new Date());

        var message = eventCalled + "\t\t" + time;
        return message;
    }

    app.start();
})();


