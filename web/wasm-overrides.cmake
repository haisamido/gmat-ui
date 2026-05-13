# GMAT WebAssembly Overrides
#
# This file is included via CMAKE_PROJECT_GMAT_INCLUDE during the project()
# call. It overrides add_library() to force SHARED libraries to STATIC,
# since WebAssembly does not support dynamic linking.

MESSAGE(STATUS "=== GMAT WASM: Applying WebAssembly overrides ===")

# Override add_library to convert SHARED -> STATIC for Emscripten
# This is necessary because GmatUtil and GmatBase explicitly specify SHARED
macro(add_library _target)
    set(_args ${ARGN})
    list(FIND _args "SHARED" _shared_idx)
    if(NOT ${_shared_idx} EQUAL -1)
        MESSAGE(STATUS "  WASM override: ${_target} SHARED -> STATIC")
        list(REMOVE_AT _args ${_shared_idx})
        _add_library(${_target} STATIC ${_args})
    else()
        _add_library(${_target} ${_args})
    endif()
endmacro()

# Disable dynamic library loading (not available in WASM)
SET(CMAKE_DL_LIBS "" CACHE STRING "No dlopen in WASM" FORCE)

# Xerces-C needs static library definition
ADD_DEFINITIONS(-DXERCES_STATIC_LIBRARY)

# Emscripten defines __EMSCRIPTEN__ but not __linux__ or __APPLE__. GMAT source
# guards POSIX includes (<unistd.h>, <dirent.h>) behind those platform macros.
# Emscripten provides these headers, so force-include them for all translation units.
SET(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -include unistd.h" CACHE STRING "" FORCE)
SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -include unistd.h" CACHE STRING "" FORCE)

MESSAGE(STATUS "=== GMAT WASM: Overrides applied ===")
