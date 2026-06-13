import time


def current_time_ms() -> int:
    return int(time.time() * 1000)


def elapsed_ms(start_time_ms: int) -> float:
    return time.time() * 1000 - start_time_ms
