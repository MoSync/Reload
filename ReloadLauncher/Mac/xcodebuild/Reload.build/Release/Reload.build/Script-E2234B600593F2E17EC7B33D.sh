#!/bin/sh
exec install_name_tool -change @executable_path/libcef.dylib "@executable_path/../Frameworks/Chromium Embedded Framework.framework/Libraries/libcef.dylib" "${BUILT_PRODUCTS_DIR}/${EXECUTABLE_PATH}"
exit 1

