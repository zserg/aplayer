﻿
// Основные сведения о пустом шаблоне см. в следующей документации:
// http://go.microsoft.com/fwlink/?LinkId=232509

(function () {
    "use strict";
    WinJS.log = console.log.bind(console);
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
    var mPlayer = null;
    var mPlayerSession = null;
    var dragInProgress = false;
    var playPos = 0;
    var queryOptions = null;
    var listView = null;
    var f = null;
    var props = null;
    var myData = [];
    var slider = null;
    var db = null;
    var trackData = {};
    var filePlayed = null;
    var createBmBut = null;
    var removeBmBut = null;
    var butPrevBm = null;
    var butNextBm = null;
    var butMode = null;
    var ONE_SECOND = 1000;
    var startBm = null;
    var endBm = null;
    var mode = null;
    var TRACK_TO_END = 0;
    var CHAPTER_TO_END = 1;
    var CHAPTER_CYCLE = 2;

    var butt_play = null;
    var butt_rew = null;

    var butt_mode = null;
    var butt_mode_0 = null;
    var butt_mode_1 = null;
    var butt_mode_2 = null;

    var appBar = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.voiceCommand) {
            // TODO: обработка соответствующих ActivationKinds. Например, если приложение можно запускать с помощью голосовых команд,
            // здесь удобно указать, требуется ли заполнить поле ввода или выбрать другое начальное представление.
        }
        else if (args.detail.kind === activation.ActivationKind.launch) {
            // Активация Launch выполняется, когда пользователь запускает ваше приложение с помощью плитки
            // или вызывает всплывающее уведомление, щелкнув основной текст или коснувшись его.
            // Create the media control.
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.running) {
                  WinJS.Utilities.startLog();
                  createDB();
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
                              myData[ndx].album = musicProp.album ? musicProp.album : "Unknown";
                              myData[ndx].artist = musicProp.artist ? musicProp.artist : "Unknown";
                              myData[ndx].duration = ms2time(musicProp.duration);
                          });
                       /* Track List Creating */
                          var listDiv = document.querySelector("#myListView");  // Your html element on the page.
                          var listView = new WinJS.UI.ListView(listDiv, {layout: {type: WinJS.UI.ListLayout}});  // Declare a new list view by hand.
                          var itemDiv = document.getElementById("mylisttemplate");  // Your template container
                          listView.itemTemplate = itemDiv;  // Bind the list view to the element

                          var dataList = new WinJS.Binding.List(myData);
                          listView.itemDataSource = dataList.dataSource;

                       /* Albums List Creating */
                          var groupedListDiv = document.querySelector("#myGroupedListView");  // Your html element on the page.
                          var groupedListView = new WinJS.UI.ListView(groupedListDiv, {layout: {type: WinJS.UI.ListLayout}});  // Declare a new list view by hand.
                          var itemDivGrouped = document.getElementById("mygroupedlisttemplate");  // Your template container
                          var headerDivGrouped = document.getElementById("mygroupedlistheadertemplate");  // Your template container
                          groupedListView.itemTemplate = itemDivGrouped;  // Bind the list view to the element
                          groupedListView.groupHeaderTemplate = headerDivGrouped;  // Bind the list view to the element

                          //var groupedDataList = dataList.createGrouped(getGroupKey, getGroupData, compareGroups);
                          var groupedDataList = dataList.createGrouped(getGroupKey, getGroupData);
                          groupedListView.groupDataSource = groupedDataList.groups.dataSource;
                          groupedListView.itemDataSource = groupedDataList.dataSource;
                          groupedListView.forceLayout();
                          groupedListDiv.winControl.addEventListener("iteminvoked", itemInvokedHandler, false);

                          listView.forceLayout();
                          listDiv.winControl.addEventListener("iteminvoked", itemInvokedHandler, false);

                          appBar = document.getElementById('appbar').winControl;
                          appBar.getCommandById('cmdBack').addEventListener('click', findPrevBookmark, false);
                          appBar.getCommandById('cmdForward').addEventListener('click', findNextBookmark, false);
                          appBar.getCommandById('cmdAdd').addEventListener('click', createBookmark, false);
                          appBar.getCommandById('cmdRemove').addEventListener('click', removeBookmark, false);
                          appBar.getCommandById('cmdPlay').addEventListener('click', playClickEv, false);
                          appBar.getCommandById('cmdRew').addEventListener('click', rewClickEv, false);
                      });

                    });


                    filePath = WinJS.Application.sessionState.filePath
                    if (filePath) {
                        Windows.Storage.StorageFile.getFileFromPathAsync(sessionState.filePath).done(getFile);
                    }

                    slider = document.getElementById("progress");
                    // slider.addEventListener("change", sliderChange, false);
                    slider.onpointerdown = sliderMouseDown;
                    slider.onpointerup = sliderMouseUp;

                    butt_mode = document.getElementById('butMode');
                    butt_mode.style.backgroundImage = "url('/images/mode0_v2.svg')";
                    butt_mode.addEventListener("click", changeMode, false);

                    butt_play = document.getElementById('playbutton');
                    butt_play.addEventListener("click", playClickEv, false);

                    butt_rew = document.getElementById('rewbutton');
                    butt_rew.addEventListener("click", rewClickEv, false);


                    mode = CHAPTER_CYCLE;
                    changeMode();


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

    app.onEnteredBackground = function (args) {
        // TODO: действие приложения будет приостановлено. Сохраните здесь все состояния, которые понадобятся после приостановки.
        // Вы можете использовать объект WinJS.Application.sessionState, который автоматически сохраняется и восстанавливается после приостановки.
        // Если вам нужно завершить асинхронную операцию до того, как действие приложения будет приостановлено, вызовите args.setPromise().
        sessionState.filePath = filePath;
        sessionState.tes = "hello";

    };

    function createDB() {
        WinJS.log && WinJS.log("createDB start", "IndexedDB", "info");
        // Create the request to open the database, named BookDB. If it doesn't exist, create it and immediately
        // upgrade to version 1.
        var dbRequest = window.indexedDB.open("PlayerDB", 1);

        // Add asynchronous callback functions
        dbRequest.onerror = function () { WinJS.log && WinJS.log("Error creating database.", "sample", "error"); };
        dbRequest.onsuccess = function (evt) { dbSuccess(evt); };
        dbRequest.onupgradeneeded = function (evt) { dbVersionUpgrade(evt); };
        dbRequest.onblocked = function () { WinJS.log && WinJS.log("Database create blocked.", "sample", "error");  };

    }

    // Whenever an IndexedDB is created, the version is set to "", but can be immediately upgraded by calling createDB.
    function dbVersionUpgrade(evt) {
        db = evt.target.result;

        // Get the version update transaction handle, since we want to create the schema as part of the same transaction.
        var txn = evt.target.transaction;

        // Create the object store, with an index on the file path. Note that we set the returned object store to a variable
        // in order to make further calls (index creation) on that object store.
        if(!db.objectStoreNames.contains("tracks")) {
                db.createObjectStore("tracks", { keyPath: "path"});
            }

        // Once the creation of the object stores is finished (they are created asynchronously), log success.
        txn.oncomplete = function () { WinJS.log && WinJS.log("Database schema created.", "sample", "status"); };
    };

    function dbSuccess(evt) {
        db = evt.target.result;
        WinJS.log && WinJS.log("Database open success", "sample", "info");
        };

    function readBookmarks(filepath) {
        WinJS.log && WinJS.log("readBookmarks start", "readData", "info");
        // Create a transaction with which to query the IndexedDB.
        var txn = db.transaction(["tracks"], "readonly");
        var objectStore = txn.objectStore("tracks");
        var request = objectStore.get(filePath);

        // Set the event callbacks for the transaction.
        request.onerror = function () { WinJS.log && WinJS.log("Error reading data.", "readData", "error"); };
        request.onabort = function () { WinJS.log && WinJS.log("Reading of data aborted.", "readData", "error"); };

        request.onsuccess = function (e) {
          trackData = e.target.result;
          if(!trackData){
             trackData = {path: filePlayed.path,
                          duration: mPlayerSession.naturalDuration,
                          bookmarks: []};
          }
          updateTicks();
          findChapter();
        };
    };

    function updateTicks(){
          WinJS.log && WinJS.log(trackData.path, "updateTicks", "info");
          var ss = String(mPlayerSession.naturalDuration)+"==" +String(trackData.duration);
          var bmNode = document.getElementById("bookmarks");
          while (bmNode.firstChild) {
                bmNode.removeChild(bmNode.firstChild);
          };

          trackData.bookmarks.forEach(function (item) {
            var tick = document.createElement("OPTION");
            tick.innerHTML = item.toFixed(0);
            bmNode.appendChild(tick);
          });
          slider.max = mPlayerSession.naturalDuration.toFixed(2);

    };


    function createBookmark(evt) {
        // Create a transaction with which to query the IndexedDB.
        WinJS.log && WinJS.log("createBookmark start", "createBookmark", "info");
        if(trackData.bookmarks){
            var txn = db.transaction(["tracks"], "readwrite");
            var objectStore = txn.objectStore("tracks");

            trackData.bookmarks.push(mPlayerSession.position);
            trackData.bookmarks.sort(function(a, b){return a-b});
            var request = objectStore.put(trackData);
            updateTicks();

            // Set the event callbacks for the transaction.
            txn.onerror = function (e) { WinJS.log && WinJS.log("transaction onerror", "createBookmark", "error"); };
            txn.onabort = function () { WinJS.log && WinJS.log("onabort", "createBookmark", "error"); };

            request.onsuccess = function (e) { WinJS.log && WinJS.log("success", "createBookmark", "info")};
            request.onerror = function (e) {WinJS.log && WinJS.log("request onerror", "createBookmark", "error")};
        }
    };

    function storeBookmark(evt) {
        // Create a transaction with which to query the IndexedDB.
        WinJS.log && WinJS.log("storeBookmark start", "storeBookmark", "info");
        console.log("storeBookmark");
        var txn = db.transaction(["tracks"], "readwrite");
        var objectStore = txn.objectStore("tracks");

        var request = objectStore.put(trackData);
        updateTicks();

        // Set the event callbacks for the transaction.
        txn.onerror = function (e) {
          var err = txn;
           WinJS.log && WinJS.log("transaction onerror", "storeBookmark", "error"); };
        txn.onabort = function () { WinJS.log && WinJS.log("onabort", "storeBookmark", "error"); };

        request.onsuccess = function (e) { WinJS.log && WinJS.log("success", "storeBookmark", "info")};
        request.onerror = function (e) {WinJS.log && WinJS.log("request onerror", "storeBookmark", "error")};
    };

   function removeBookmark(){
      if(trackData.bookmarks){
        var cur_pos = mPlayerSession.position;
        var bmLength = trackData.bookmarks.length;
        startBm = null;
        endBm = null;
        for(var i=0; i< bmLength;i++){
          if(Math.abs(trackData.bookmarks[i] - cur_pos) < 0.03) {
             trackData.bookmarks.splice(i,1)
          }
        }
        storeBookmark();
      }
   };

  function itemInvokedHandler(eventObject) {
                eventObject.detail.itemPromise.done(function (invokedItem) {
                openAudioFromPath(invokedItem.data.path);
                    // Access item data from the itemPromise
                  var piv = document.getElementsByClassName("win-pivot")
                  var myPiv = piv[0];
                  myPiv.winControl.selectedIndex = 0;
                    WinJS.log && WinJS.log("The item at index " + invokedItem.index + " is "
                        + invokedItem.data.title + " with a text value of "
                        + invokedItem.data.text, "sample", "status");
                });
            };


    function openAudio(file) {
        if (file) {
            filePlayed = file;
            fileLocation = window.URL.createObjectURL(filePlayed, { oneTimeOnly: true });
            filePath = filePlayed.path;
            mPlayer.source = Windows.Media.Core.MediaSource.createFromStorageFile(filePlayed);
            mplayerPlay();
            readBookmarks();// read bookmarks from IndexedDB
            slider.addEventListener("change", sliderChange, false);
            file.properties.getMusicPropertiesAsync().done(function (mprops){
              var title = mprops.title;
              var album = mprops.album;
              var artist = mprops.artist;
              var info_el = document.getElementById("track-info")
              info_el.innerHTML = title+'<p>'+artist+'</p>';
              var r_count_el = document.getElementById("couter-right")

              r_count_el.innerHTML = ms2time(mprops.duration);
            });

           file.getThumbnailAsync(
               Windows.Storage.FileProperties.ThumbnailMode.musicView,
               80,
               Windows.Storage.FileProperties.ThumbnailOptions.useCurrentScale).then(
                   function (thumbnail) {
                     if (thumbnail.size > 0) {
                        var imageBlob = window.URL.createObjectURL(thumbnail);
                        document.getElementById("img").src = imageBlob;
                     }
                   }
          );

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
            } else {
                WinJS.log && WinJS.log("Audio Tag Did Not Load Properly", "sample", "error");
            }

        };


    function mediaButtonPressed(e) {
        switch (e.button) {
            case Windows.Media.SystemMediaTransportControlsButton.play:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                mplayerPlay();
                break;

            case Windows.Media.SystemMediaTransportControlsButton.pause:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                mplayerPause()
                break;

            default:
                break;
        }
    }


    function onPositionChanged() {
      if(!dragInProgress){
         slider.value = mPlayerSession.position.toFixed(2);
          var l_count_el = document.getElementById("couter-left")
          l_count_el.innerHTML = ms2time(mPlayerSession.position);
          var r_count_el = document.getElementById("couter-right")
          r_count_el.innerHTML = ms2time(mPlayerSession.naturalDuration - mPlayerSession.position);
         var pos = (mPlayerSession.position/mPlayerSession.naturalDuration*100).toFixed(2);
         var time = new Date();
         time.setTime((mPlayerSession.position).toFixed(0));
         if(mode == CHAPTER_TO_END && (endBm != null) && (mPlayerSession.position > trackData.bookmarks[endBm])){
           mplayerPause();
           if(startBm != null){
              mPlayerSession.position = trackData.bookmarks[startBm];
           }else{
              mPlayerSession.position = 0;
           }
         }else if(mode == CHAPTER_CYCLE && (endBm != null) && (mPlayerSession.position > trackData.bookmarks[endBm])){
           if(startBm != null){
              mPlayerSession.position = trackData.bookmarks[startBm];
           }else{
              mPlayerSession.position = 0;
           }
           mplayerPause()
           window.setTimeout(function () { mplayerPlay()}, 1000);
         }

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
        findChapter();
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

    function findPrevBookmark() {
        if(trackData.bookmarks){
          var cur_pos = mPlayerSession.position;
          var new_pos = 0;
          var bmLength = trackData.bookmarks.length;
          for(var i=0; i< bmLength;i++){
            if(trackData.bookmarks[i] < cur_pos && Math.abs(trackData.bookmarks[i]-cur_pos) > ONE_SECOND){
               new_pos = trackData.bookmarks[i]-0.01;
            }else{
              break;
            }
          }
          mPlayerSession.position = new_pos;
          findChapter();
        }
    };

    function findNextBookmark() {
        if(trackData.bookmarks){
          var cur_pos = mPlayerSession.position;
          var bmLength = trackData.bookmarks.length;
          for(var i=0; i< bmLength;i++){
            if(trackData.bookmarks[i] > cur_pos) {
               mPlayerSession.position = trackData.bookmarks[i] + 0.01;
               break;
            }
          }
          findChapter();
        }
    };

    function findChapter() {
      var cur_pos = mPlayerSession.position;

      var bmLength = trackData.bookmarks.length;
      startBm = null;
      endBm = null;
      for(var i=0; i< bmLength;i++){
        if(trackData.bookmarks[i] <= cur_pos) {
           startBm = i;
        }
        if(trackData.bookmarks[i] > cur_pos) {
           endBm = i;
           break;
        }
      }
      var chapB = document.getElementById("chapter-start");
      var chapE = document.getElementById("chapter-end");
      chapB.innerHTML = (startBm!=null ? startBm : "B");
      chapE.innerHTML = (endBm!=null ? endBm : "E");
    };



   function changeMode(){
     if(mode == TRACK_TO_END){
       mode = CHAPTER_TO_END;
       butt_mode.style.backgroundImage = "url('/images/mode1_v2.svg')";
     }else if(mode == CHAPTER_TO_END){
       mode = CHAPTER_CYCLE;
       butt_mode.style.backgroundImage = "url('/images/mode2_v2.svg')";
     }else{
       mode = TRACK_TO_END;
       butt_mode.style.backgroundImage = "url('/images/mode0_v2.svg')";
     }
   };

   function ms2time (ms){
     var x = Math.floor(ms/1000);
     var sec = x % 60;
     x = Math.floor(x/60);
     var min = x % 60;
     var hour = Math.floor(x/60);
     var str = hour + ':' +
       ((min < 10) ? ("0"+min) : min) +':'+
       ((sec<10) ? ("0"+sec) : sec);
     return str;
   };

   function getGroupKey(dataItem){
      return dataItem.album;
   }

   function getGroupData(dataItem){
      return {groupTitle: dataItem.album};
   }

    function compareGroups(left, right) {
        return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

  // Button Handlers
    function playClickEv() {
        butt_play.classList.toggle("buttonActive");
        var cmd = appBar.getCommandById('cmdPlay');
        switch (mPlayerSession.playbackState) {
          case Windows.Media.Playback.MediaPlayerState.paused:
                // Handle the Play event and print status to screen..
                WinJS.log && WinJS.log("Play Received", "sample", "status");
                mplayerPlay()
                cmd.icon = 'pause';
                cmd.label = 'Pause';
                break;

          case Windows.Media.Playback.MediaPlayerState.playing:
                // Handle the Pause event and print status to screen.
                WinJS.log && WinJS.log("Pause Received", "sample", "status");
                mplayerPause()
                cmd.icon = 'play';
                cmd.label = 'Play';
                break;

            default:
                break;
        }
        window.setTimeout(function () {
           butt_play.classList.toggle("buttonActive");
        }, 200);
    };


    function rewClickEv() {
         butt_rew.classList.toggle("buttonActive");
         mPlayerSession.position-=5000.0;
         if(mPlayerSession.playbackState == Windows.Media.Playback.MediaPlayerState.playing){
            mplayerPause()
            window.setTimeout(function () { mplayerPlay()}, 1000);
         }
         window.setTimeout(function () {
            butt_rew.classList.toggle("buttonActive");
         }, 200);
    }

    function mplayerPlay() {
        var cmd = appBar.getCommandById('cmdPlay');
        cmd.icon = 'pause';
        cmd.label = 'Pause';
        mPlayer.play()
    }

    function mplayerPause() {
        var cmd = appBar.getCommandById('cmdPlay');
        cmd.icon = 'play';
        cmd.label = 'Play';
        mPlayer.pause()
    }



  app.start();
})();


