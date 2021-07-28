let errors = []

function printStackTrace(e) {
    if (e.stack) {
        console.log(e.stack);
    } else {
        console.log(e.message, e);
    }
}

function check(func) {
    try {
        return func();
    } catch (e) {
        return false;
    }
}

function resolveUrl(url) {
    if (url.searchParams.has("name")) {
        url.searchParams.set("name", "orig");
    }
    return `${url.origin}${url.pathname}?${url.searchParams}`;
}

function expand(imageContainer) {
    let imagePadding = imageContainer.children[0];
    let imageDummy = imageContainer.children[1].firstElementChild;
    if (!imageContainer.children[1].hasChildNodes()) {
        // 読み込み中
        return false;
    }
    let displayImage = imageDummy.children[0];
    let image = imageDummy.children[1];
    if (image == undefined) {
        return;
    }
    let url = new URL(displayImage.style.backgroundImage.substring("url('".length, displayImage.style.backgroundImage.length - "')".length));
    let resolvedUrl = resolveUrl(url);
    if (image.src != resolvedUrl) {
        displayImage.style.backgroundImage = `url("${resolvedUrl}")`;
        image.src = resolvedUrl;
    }
    if (image.naturalWidth == 0 || image.naturalHeight == 0) {
        return;
    }

    imageDummy.style.margin = null;
    imagePadding.style.paddingBottom = `${(image.naturalHeight / image.naturalWidth) * 100}%`;
    return true;
}

setInterval(function () {
    let tweets;
    if (location.pathname.includes("/status/")) {
        tweets = document.querySelectorAll("main > div > div > div > div > div > div:nth-child(2) > div > section > div > div > div");
    } else if (location.pathname.startsWith("/home")) {
        tweets = document.querySelectorAll("main > div > div > div > div > div > div:nth-child(4) > div > div > section > div > div > div");
    } else if (location.pathname.startsWith("/search")) {
        tweets = document.querySelectorAll("main > div > div > div > div > div > div:nth-child(2) > div > div > section > div > div > div");
    } else {
        tweets = document.querySelectorAll("main > div > div > div > div > div > div:nth-child(2) > div > div > div > section > div > div > div");
    }
    tweets.forEach(tweet => {
        try {
            if (tweet.getAttribute("expanded") == "true" || !tweet.hasChildNodes()) {
                return;
            }
            let tweetContainer = tweet.querySelector("div > div > article > div > div > div > div[data-testid=tweet]");
            if (tweetContainer == null) {
                return;
            }
            let fields = tweetContainer.children[1].children[1];
            if (fields == undefined || (fields.childElementCount == 4 && fields.lastElementChild.getAttribute("role") != "group")) {
                // プロモーション
                return;
            }
            let imageField;
            if (fields.childElementCount == 4) {
                // 返信
                imageField = fields.children[2];
            } else {
                // ツイート
                imageField = fields.children[1];
            }
            if (!imageField.hasChildNodes()) {
                return;
            }
            if (check(() => imageField.firstElementChild.childElementCount == 2)) {
                let aOrDiv = imageField.firstElementChild.lastElementChild.firstElementChild.firstElementChild.firstElementChild;
                if (aOrDiv.tagName == "A") {
                    // 画像付き引用ツイート
                    let imageContainer = imageField.firstElementChild.lastElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 複数画像付き引用ツイート
                    tweet.setAttribute("expanded", "true");  // TODO: 実装する
                }
            } else if (check(() => imageField.firstElementChild.lastElementChild.lastElementChild.getAttribute("data-testid") == "card.wrapper")) {
                // Embed
            } else if (check(() => [2, 3].includes(imageField.firstElementChild.lastElementChild.firstElementChild.children[1].firstElementChild.childElementCount))) {
                // 引用ツイート
                if (imageField.firstElementChild.lastElementChild.firstElementChild.children[1].firstElementChild.childElementCount == 2) {
                    // 画像無し
                    return;
                }
                let aOrDiv = imageField.firstElementChild.lastElementChild.firstElementChild.lastElementChild.firstElementChild
                    .lastElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
                if (aOrDiv.tagName == "A") {
                    // 画像一枚の時
                    let imageContainer = imageField.firstElementChild.lastElementChild.firstElementChild.children[1].firstElementChild
                        .lastElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 画像複数枚の時
                    tweet.setAttribute("expanded", "true");  // TODO: 実装する
                }
            } else if (check(() => imageField.firstElementChild.lastElementChild.firstElementChild.firstElementChild.lastElementChild.hasChildNodes())) {
                // メディア付きツイート
                let aOrDiv = imageField.firstElementChild.lastElementChild.firstElementChild.firstElementChild.lastElementChild;
                if (check(() => imageField.firstElementChild.lastElementChild.firstElementChild.firstElementChild.lastElementChild.firstElementChild.firstElementChild.getAttribute("data-testid") == "videoPlayer")) {
                    // 動画
                    return;
                }
                if (aOrDiv.tagName == "A") {
                    // 画像一枚の時
                    let imageContainer = aOrDiv.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 画像複数枚の時 大分スパゲッティ
                    let imageContainer = aOrDiv;
                    let imagePadding = imageContainer.children[0];
                    let imageAs = [];
                    let width = 0;
                    let height = 0;
                    let rowHeight = 0;
                    Array.from(imageContainer.children[1].firstElementChild.children).forEach(imageAOrDiv => {
                        if (imageAOrDiv.tagName == "A") {
                            // 複数枚ある画像の横に並んでるやつ
                            imageAs.push(imageAOrDiv);

                            let imageDummy = imageAOrDiv.firstElementChild.firstElementChild;
                            if (!imageAOrDiv.firstElementChild.hasChildNodes()) {
                                // 読み込み中
                                return;
                            }
                            let image = imageDummy.children[1];
                            if (image == undefined || !image.complete) {
                                return;
                            }
                            width += parseInt(image.naturalWidth);
                            if (parseInt(image.naturalHeight) > rowHeight) {
                                rowHeight = parseInt(image.naturalHeight);
                            }
                        } else {
                            let columnWidth = 0;
                            let columnHeight = 0;
                            Array.from(imageAOrDiv.children).forEach(a => {
                                // 複数枚ある画像の縦に並んでるやつ
                                imageAs.push(a);

                                let imageDummy = a.firstElementChild.firstElementChild;
                                if (!a.firstElementChild.hasChildNodes()) {
                                    // 読み込み中
                                    return;
                                }
                                let image = imageDummy.children[1];
                                if (image == undefined || !image.complete) {
                                    return;
                                }

                                if (parseInt(image.naturalWidth) > columnWidth) {
                                    columnWidth = parseInt(image.naturalWidth);
                                }
                                columnHeight += parseInt(image.naturalHeight);
                            });
                            width += columnWidth;
                            if (columnHeight > height) {
                                height = columnHeight;
                            }
                        }
                    });
                    if (rowHeight > height) {
                        height = rowHeight;
                    }
                    imagePadding.style.paddingBottom = `${(height / width) * 100}%`;

                    let flag = true;
                    imageAs.forEach(imageA => {
                        let imageDummy = imageA.firstElementChild.firstElementChild;
                        if (!imageA.firstElementChild.hasChildNodes()) {
                            // 読み込み中
                            flag = false
                            return;
                        }
                        let displayImage = imageDummy.children[0];
                        let image = imageDummy.children[1];
                        if (!image.complete) {
                            flag = false
                            return;
                        }
                        imageDummy.style.margin = null;
                        let url = new URL(displayImage.style.backgroundImage.substring("url('".length, displayImage.style.backgroundImage.length - "')".length));
                        let resolvedUrl = resolveUrl(url);
                        displayImage.style.backgroundImage = `url("${resolvedUrl}")`;
                        image.src = resolvedUrl;
                        imageA.firstElementChild.style.height = image.naturalHeight.toString();
                    });
                    if (flag) {
                        tweet.setAttribute("expanded", "true");
                    }
                }
            }
        } catch (e) {
            if (!errors.includes(tweet)) {
                errors.push(tweet);
                console.log("Failed to expand tweet", tweet);
                printStackTrace(e);
            }
        }
    });
}, 100);