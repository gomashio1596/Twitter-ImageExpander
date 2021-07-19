let errors = []

function printStackTrace(e) {
    if (e.stack) {
        console.log(e.stack);
    } else {
        console.log(e.message, e);
    }
}

function resolveUrl(url) {
    if (url.searchParams.has("name")) {
        url.searchParams.set("name", "medium");
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
    if (!image.complete) {
        return;
    }
    imageDummy.style.margin = null;
    let url = new URL(displayImage.style.backgroundImage.substring("url('".length, displayImage.style.backgroundImage.length - "')".length));
    let resolvedUrl = resolveUrl(url);
    displayImage.style.backgroundImage = `url("${resolvedUrl}")`;
    image.src = resolvedUrl;
    imagePadding.style.paddingBottom = `${(image.naturalHeight / image.naturalWidth) * 100}%`;
    return true;
}

setInterval(function () {
    let tweets = document.querySelectorAll("main > div > div > div > div > div > div:nth-child(4) > div > div > section > div > div > div");
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
            if (fields.childElementCount == 4) {
                // プロモーション
                return;
            }
            let imageField = fields.children[1];
            if (!imageField.hasChildNodes()) {
                return;
            }
            if (imageField.firstElementChild.childElementCount == 2) {
                if (imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.tagName == "A") {
                    // 画像付き引用ツイート
                    let imageContainer = imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
                    if (expand(imageContainer)) {
                        tweet.setAttribute("expanded", "true");
                    }
                } else {
                    // 複数画像付き引用ツイート
                    tweet.setAttribute("expanded", "true");
                }
            } else if (imageField.firstElementChild.firstElementChild.firstElementChild.childElementCount == 2) {
                // 引用ツイート
                if (!imageField.firstElementChild.firstElementChild.firstElementChild.children[1].firstElementChild.childElementCount == 3) {
                    return;
                }
                let imageContainer = imageField.firstElementChild.firstElementChild.firstElementChild.children[1].firstElementChild
                    .children[2].firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
                if (expand(imageContainer)) {
                    tweet.setAttribute("expanded", "true");
                }
            } else if (imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.hasChildNodes()) {
                // 画像付きツイート
                let aOrDiv = imageField.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
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
                            if (!image.complete) {
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
                                if (!image.complete) {
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