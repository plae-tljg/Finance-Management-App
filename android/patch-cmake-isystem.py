#!/usr/bin/env python3
# Patch every CMakeLists.txt under node_modules and android/app/build/generated
# that builds RN/Folly/jsi code so the NDK sysroot include dirs are added
# with -isystem, fixing the bionic <sys/types.h> -> <bits/pthread_types.h>
# "unknown type name 'uint32_t'" build failure on NDK r25/r26b/r27.
import os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()

MARKER = "# === Finance-Management-App: NDK sysroot include workaround ==="

def make_patch(target):
    return f'''{MARKER}
# Force the NDK sysroot include dirs onto the search path so the real
# stdint.h wins over clang's wrapper, fixing "unknown type name uint32_t"
# in bionic <sys/types.h>/<bits/pthread_types.h>. We use SHELL: so the
# -isystem flag and its path stay as a single argv entry (what clang needs).
get_target_property(_isr_type {target} TYPE)
get_target_property(_isr_sysroot {target} sysroot)
if(NOT _isr_sysroot)
    set(_isr_sysroot "${{ANDROID_NDK}}/toolchains/llvm/prebuilt/linux-x86_64/sysroot")
endif()
if(EXISTS "${{_isr_sysroot}}/usr/include/stdint.h")
    set(_isr_options
        "SHELL:-isystem ${{_isr_sysroot}}/usr/include/c++/v1"
        "SHELL:-isystem ${{_isr_sysroot}}/usr/include"
    )
    if(CMAKE_LIBRARY_ARCHITECTURE)
        list(APPEND _isr_options
            "SHELL:-isystem ${{_isr_sysroot}}/usr/include/${{CMAKE_LIBRARY_ARCHITECTURE}}"
        )
    endif()
    if(_isr_type STREQUAL "INTERFACE_LIBRARY")
        target_compile_options({target} INTERFACE ${{_isr_options}})
    else()
        target_compile_options({target} PRIVATE ${{_isr_options}})
    endif()
endif()
# === end workaround ===

'''

# Match `add_library(<name>` up to the matching `)`, allowing multiline.
ADD_LIB_RE = re.compile(r'''add_library\(\s*(\$\{[\w]+\}|\w+)[^)]*\)''', re.DOTALL)

def patch_file(path):
    with open(path) as f:
        src = f.read()
    if MARKER in src:
        print(f"  skip (has marker): {path}", file=sys.stderr)
        return False

    def repl(m):
        name = m.group(1)
        return m.group(0) + "\n" + make_patch(name)

    new = ADD_LIB_RE.sub(repl, src, count=1)
    if MARKER not in new:
        if not ADD_LIB_RE.search(src):
            print(f"  skip (no add_library): {path}", file=sys.stderr)
            return False
        new = src + "\n" + make_patch('${CMAKE_PROJECT_NAME}')
    if new == src:
        print(f"  no-op: {path}", file=sys.stderr)
        return False
    with open(path, 'w') as f:
        f.write(new)
    print(f"  patched: {path}", file=sys.stderr)
    return True

patches = []
for base in [os.path.join(ROOT, 'node_modules'), os.path.join(ROOT, 'android/app/build/generated')]:
    if not os.path.isdir(base):
        continue
    for dirpath, _, files in os.walk(base):
        for fname in files:
            if fname == 'CMakeLists.txt' or fname.endswith('.cmake'):
                p = os.path.join(dirpath, fname)
                try:
                    if patch_file(p):
                        patches.append(p)
                except Exception as e:
                    print(f"skip {p}: {e}", file=sys.stderr)

print(f"Patched {len(patches)} CMakeLists.txt files:")
for p in patches:
    print(f"  {p}")