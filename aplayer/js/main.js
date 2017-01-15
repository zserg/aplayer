
// Основные сведения о пустом шаблоне см. в следующей документации:
// http://go.microsoft.com/fwlink/?LinkId=232509

(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var MediaPlayer = Windows.Media.Playback.MediaPlayer;
    var sessionState = WinJS.Application.sessionState;
    var musicLibId = Windows.Storage.KnownLibraryId.Music;
    var search = Windows.Storage.Search;

    var isFirstActivation = true;
    var systemMediaControls = null;
    var audtag = null;
    var playBut = null;
    var rewBut = null;
    var playImg = null;
    var rewImg = null;
    var fileLocation = null;
    var filePath = null;
    var storageFolder = null;
    var g_dispRequest = null;
    var openPicker = null;
    var mPlayer = null;
    var mPlayerSession = null;
    var _startX = 0;            // mouse starting positions
    var _startY = 0;
    var _offsetX = 0;           // current element offset
    var _offsetY = 0;
    var bLeft = null;
    var bRight = null;
    var dragInProgress = false;
    var playPos = 0;
    var queryOptions = null;
    var listView = null;
    var f = null;
    var props = null;
    var myData = [];
    var slider = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.voiceCommand) {
            // TODO: обработка соответствующих ActivationKinds. Например, если приложение можно запускать с помощью голосовых команд,
            // здесь удобно указать, требуется ли заполнить поле ввода или выбрать другое начальное представление.
        }
        else if (args.detail.kind === activation.ActivationKind.launch) {
            // Активация Launch выполняется, когда пользователь запускает ваше приложение с помощью плитки
            // или вызывает всплывающее уведомление, щелкнув основной текст или коснувшись его.
            // Create the media control.
            systemMediaControls = Windows.Media.SystemMediaTransportControls.getForCurrentView();
            systemMediaControls.addEventListener("propertychanged", mediaPropertyChanged, false);
            systemMediaControls.addEventListener("buttonpressed", mediaButtonPressed, false);
            systemMediaControls.isPlayEnabled = true;
            systemMediaControls.isPauseEnabled = true;
            systemMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;

            mPlayer = new MediaPlayer();
            mPlayer.autoPlay = false;
            mPlayerSession = mPlayer.playbackSession;
            mPlayerSession.addEventListener("positionchanged", onPositionChanged)
            mPlayerSession.addEventListener("naturaldurationchanged", function(){
                slider.max = mPlayerSession.naturalDuration.toFixed(2);
                });

            queryOptions = new search.QueryOptions(search.CommonFileQuery.OrderByTitle, [".mp3"]);
            queryOptions.folderDepth = search.FolderDepth.deep;
            var query = Windows.Storage.KnownFolders.musicLibrary.createFileQueryWithOptions(queryOptions);


            var filePromises = [];
            query.getFilesAsync().done(function (files) {
                // Get image properties
               files.forEach(function (file) {
                  props = file.properties;
                  myData.push({path:file.path, name:file.displayName});
                  filePromises.push(props.getMusicPropertiesAsync())
                  });

               Promise.all(filePromises).then(function (musicProperties){
                    musicProperties.forEach(function (musicProp, ndx) {
                        myData[ndx].title = musicProp.title ? musicProp.title : myData[ndx].name;
                    });
                    var listDiv = document.querySelector("#myListView");  // Your html element on the page.
                    var listView = new WinJS.UI.ListView(listDiv, null);  // Declare a new list view by hand.

                    var itemDiv = document.getElementById("mylisttemplate");  // Your template container
                    var itemTemplate = new WinJS.Binding.Template(itemDiv, null);  // Create a template
                    listView.itemTemplate = itemDiv;  // Bind the list view to the element
                    var dataList = new WinJS.Binding.List(myData);
                    listView.itemDataSource = dataList.dataSource;
                    listView.forceLayout();
                    listDiv.winControl.addEventListener("iteminvoked", itemInvokedHandler, false);
                });

              });


            openPicker = new Windows.Storage.Pickers.FileOpenPicker();
            openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
            openPicker.fileTypeFilter.replaceAll([".mp3"]);

            filePath = WinJS.Application.sessionState.filePath
            if (filePath) {
                Windows.Storage.StorageFile.getFileFromPathAsync(sessionState.filePath).done(getFile);
            }

            slider = document.getElementById("progress");
            slider.addEventListener("change", sliderChange, false);
            slider.onpointerdown = sliderMouseDown;
            slider.onpointerup = sliderMouseUp;

            rewBut = document.getElementById('rewbutton');
            rewBut.addEventListener("click", rClick, false);
            playBut = document.getElementById('playbutton');
            playBut.addEventListener("click", pClick, false);
            if (g_dispRequest === null) {
                try {
                    // This call creates an instance of the displayRequest object
                    g_dispRequest = new Windows.System.Display.DisplayRequest;
                    g_dispRequest.requestActive();
                } catch (e) {
                    WinJS.log && WinJS.log("Failed: displayRequest object creation, error: " + e.message, "sample", "error");
                }
            }

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
        sessionState.filePath = filePath;
        sessionState.tes = "hello";

    };

  function itemInvokedHandler(eventObject) {
                eventObject.detail.itemPromise.done(function (invokedItem) {
                openAudioFromPath(invokedItem.data.path);
                    // Access item data from the itemPromise
                    WinJS.log && WinJS.log("The item at index " + invokedItem.index + " is "
                        + invokedItem.data.title + " with a text value of "
                        + invokedItem.data.text, "sample", "status");
                });
            };

  function pickFile() {
        openPicker.pickSingleFileAsync().done(function (file) {
            if (file) {
                // Store the file to access again later
                sessionState.lastFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
                file.getParentAsync().done(function (folder) {
                    openAudio(file);
                })
            } else {
                // No file
            }
        }
      )
    };

    function openAudio(file) {
        if (file) {
            fileLocation = window.URL.createObjectURL(file, { oneTimeOnly: true });
            filePath = file.path;
            mPlayer.source = Windows.Media.Core.MediaSource.createFromStorageFile(file);
            mPlayer.play();

        } else {
            WinJS.log && WinJS.log("Audio Tag Did Not Load Properly", "sample", "error");
        }

    };

    function openAudioFromPath(filePath) {
            Windows.Storage.StorageFile.getFileFromPathAsync(filePath).done(openAudio);
    };

    function getFile(file) {
            if (file) {
                mPlayer.source = Windows.Media.Core.MediaSource.createFromStorageFile(file);
                // fileLocation = window.URL.createObjectURL(file, { oneTimeOnly: true });
                // filePath = file.path;
                // audtag = document.getElementById("audtag");
                // audtag.setAttribute("src", fileLocation);

            } else {
                WinJS.log && WinJS.log("Audio Tag Did Not Load Properly", "sample", "error");
            }

        };


    function mediaButtonPressed(e) {
        switch (e.button) {
            case Windows.Media.SystemMediaTransportControlsButton.play:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                mPlayer.play()
                // audtag.play();
                break;

            case Windows.Media.SystemMediaTransportControlsButton.pause:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                // audtag.pause();
                mPlayer.pause()
                break;

            default:
                break;
        }
    }
    function pClick() {
        switch (mPlayerSession.playbackState) {
          case Windows.Media.Playback.MediaPlayerState.paused:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                mPlayer.play()
                // audtag.play();
                break;

          case Windows.Media.Playback.MediaPlayerState.playing:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                mPlayer.pause()
                // audtag.pause();
                break;

            default:
                break;
        }
    }

    function rClick() {
         mPlayerSession.position-=5000.0;
         if(mPlayerSession.playbackState == Windows.Media.Playback.MediaPlayerState.playing){
            mPlayer.pause()
            window.setTimeout(function () { mPlayer.play()}, 1000);
         }
    }

    function onPositionChanged() {
      if(!dragInProgress){
         slider.value = mPlayerSession.position.toFixed(2);
         var pos = (mPlayerSession.position/mPlayerSession.naturalDuration*100).toFixed(2);
         var time = new Date();
         time.setTime((mPlayerSession.position).toFixed(0));
      }
    }

    function mediaPropertyChanged(e) {
        switch (e.property) {
            case Windows.Media.SystemMediaTransportControlsProperty.soundLevel:
                //Catch SoundLevel notifications and determine SoundLevel state.  If it's muted, we'll pause the player.
                var soundLevel = e.target.soundLevel;

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

    function OnMouseDown(e) {
        if (e.button == 0) {
            dragInProgress = true;
            document.onpointermove = OnMouseMove;
        }
    };

    function OnMouseMove(e)
    {
    }

  function sliderMouseUp(e)
    {
      dragInProgress = false;
    };

    function sliderMouseDown(e) {
        dragInProgress = true;
    };

  function sliderChange(e)
    {
        mPlayerSession.position = slider.value;
    };


  function OnMouseUp(e)
    {
      document.onpointermove = null;
      dragInProgress = false;
      mPlayerSession.position = mPlayerSession.naturalDuration * playPos/100.0;
    };

  function OnMouseLeave(e)
    {
      document.onpointermove = null;
      dragInProgress = false;
    };

  function xCalculate(boundLeft, boudRight, x)
    {
      var x_int;
      if(x < boundLeft){
        x_int = boundLeft;
      }else if(x > boudRight) {
        x_int = boudRight;
      }else{
        x_int = x;
      }
      return (((x_int-boundLeft)/(boudRight-boundLeft))*100).toFixed(2);
    };


  function countersCalculate(pos)
    {
      var x_int;
      if(x < boundLeft){
        x_int = boundLeft;
      }else if(x > boudRight) {
        x_int = boudRight;
      }else{
        x_int = x;
      }
      return (((x_int-boundLeft)/(boudRight-boundLeft))*100).toFixed(2);
         document.getElementById("counter-left").innerHTML = time.getHours()+':'+
                                                             time.getMinutes()+':'+
                                                             time.getSeconds();
    };


    app.start();
})();


