#ifndef _PORTABLE_SNPRINTF_H_
#define _PORTABLE_SNPRINTF_H_

#define PORTABLE_SNPRINTF_VERSION_MAJOR 2
#define PORTABLE_SNPRINTF_VERSION_MINOR 2

#include <maarg.h>
#include <ma.h>

#ifdef __cplusplus
extern "C"{
#endif

#ifdef MAPIP
#define ATTRIB_2 __attribute((format(printf, 2, 3)))
#define ATTRIB_3 __attribute((format(printf, 3, 4)))
#define VATTRIB_2 __attribute((format(printf, 2, 0)))
#define VATTRIB_3 __attribute((format(printf, 3, 0)))
#else
#define ATTRIB_2
#define ATTRIB_3
#define VATTRIB_2
#define VATTRIB_3
#endif

#ifdef HAVE_SNPRINTF
#include <stdio.h>
#else
extern int snprintf(char *, size_t, const char *, /*args*/ ...) ATTRIB_3;
extern int vsnprintf(char *, size_t, const char *, va_list) VATTRIB_3;
#endif

#if defined(HAVE_SNPRINTF) && defined(PREFER_PORTABLE_SNPRINTF)
extern int portable_snprintf(char *str, size_t str_m, const char *fmt, /*args*/ ...) ATTRIB_3;
extern int portable_vsnprintf(char *str, size_t str_m, const char *fmt, va_list ap) VATTRIB_3;
#define snprintf  portable_snprintf
#define vsnprintf portable_vsnprintf
#endif

extern int asprintf  (char **ptr, const char *fmt, /*args*/ ...) ATTRIB_2;
extern int vasprintf (char **ptr, const char *fmt, va_list ap) VATTRIB_2;
extern int asnprintf (char **ptr, size_t str_m, const char *fmt, /*args*/ ...) ATTRIB_3;
extern int vasnprintf(char **ptr, size_t str_m, const char *fmt, va_list ap) VATTRIB_3;

#ifdef __cplusplus
}
#endif
#endif
