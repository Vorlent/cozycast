package = "Cozycast-Worker"
version = "1.0-1"
source = {
    url = "https://github.com/Vorlent/cozycast"
}
description = {
    summary = "movie night over the internet ",
    detailed = [[
    ]],
    homepage = "https://github.com/Vorlent/cozycast",
    license = "GPL3"
}
dependencies = {
    "lua >= 5.1, < 5.4",
    "http >= 0.2-0",
    "lunajson >= 1.2-0",
    "luaffi = scm-1"
}
build = {
    type = "builtin",
    modules = {}
}
