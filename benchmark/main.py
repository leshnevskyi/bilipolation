import os
import subprocess
import time

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

DENO_COMMAND_TEMPLATE = [
    "deno",
    "run",
    "--allow-all",
    "../main.ts",
    "images/large.jpg",
    "--out-file=output/resized.jpg",
    "--scale=0.2",
]
PROCESSOR_ARG_PREFIX = "--processors="
PROCESSOR_COUNTS = [1, 2, 4, 6]
RUNS_PER_CONFIG = 5

CHART_EXEC_TIME_FILE = "output/execution.png"
CHART_SPEEDUP_FILE = "output/speedup.png"


def time_command(command_list):
    """Runs a command and returns its execution time in seconds."""
    start_time = time.perf_counter()
    try:
        process = subprocess.run(
            command_list, capture_output=True, text=True, check=True
        )
        print("STDOUT:", process.stdout)
        print("STDERR:", process.stderr or "No errors")
    except subprocess.CalledProcessError as e:
        print(f"Command '{' '.join(command_list)}' failed with error:")
        print(e.stderr)
        return None
    except FileNotFoundError:
        print(f"Error: 'deno' command not found. Is Deno installed and in your PATH?")
        return None
    end_time = time.perf_counter()
    return end_time - start_time


print("Starting benchmarks...")
results = []

if not os.path.exists(DENO_COMMAND_TEMPLATE[3]):
    print(
        f"Error: Deno script '{DENO_COMMAND_TEMPLATE[3]}' not found. Please check the path."
    )
    exit()
if not os.path.exists(DENO_COMMAND_TEMPLATE[4]):
    print(
        f"Error: Image file '{DENO_COMMAND_TEMPLATE[4]}' not found. Please check the path."
    )
    exit()


for p_count in PROCESSOR_COUNTS:
    command_to_run = DENO_COMMAND_TEMPLATE + [f"{PROCESSOR_ARG_PREFIX}{p_count}"]
    print(
        f"\nBenchmarking with {p_count} processor(s)... Command: {' '.join(command_to_run)}"
    )

    current_times = []
    for i in range(RUNS_PER_CONFIG):
        print(f"  Run {i+1}/{RUNS_PER_CONFIG}...", end="", flush=True)
        exec_time = time_command(command_to_run)
        if exec_time is not None:
            current_times.append(exec_time)
            print(f" done ({exec_time:.4f}s)")
        else:
            print(" failed.")
            current_times = []
            break

    if current_times:
        mean_time = np.mean(current_times)
        std_dev_time = np.std(current_times)
        median_time = np.median(current_times)
        min_time = np.min(current_times)
        max_time = np.max(current_times)
        results.append(
            {
                "processors": p_count,
                "mean_time": mean_time,
                "std_dev": std_dev_time,
                "median_time": median_time,
                "min_time": min_time,
                "max_time": max_time,
                "all_times": current_times,
            }
        )
    else:
        print(f"Skipping processor count {p_count} due to failed runs.")


if not results:
    print("\nNo benchmark results were collected. Exiting.")
    exit()

df_results = pd.DataFrame(results)
df_results = df_results.sort_values(by="processors").reset_index(drop=True)

time_1_processor_df = df_results[df_results["processors"] == 1]

if time_1_processor_df.empty:
    print(
        "\nError: Execution time for 1 processor not found in results. Cannot calculate speedup."
    )

    if not df_results.empty:
        baseline_processors = df_results["processors"].iloc[0]
        print(
            f"Warning: Using results for {baseline_processors} processor(s) as baseline for speedup."
        )
        time_1_processor = df_results["mean_time"].iloc[0]
        df_results["speedup"] = time_1_processor / df_results["mean_time"]
        df_results.loc[df_results["processors"] == baseline_processors, "speedup"] = (
            time_1_processor
            / df_results[df_results["processors"] == baseline_processors]["mean_time"]
        )

    else:
        df_results["speedup"] = np.nan
else:
    time_1_processor = time_1_processor_df["mean_time"].iloc[0]
    df_results["speedup"] = time_1_processor / df_results["mean_time"]


print("\n--- Execution Times Table ---")
exec_times_table_display = df_results[
    ["processors", "mean_time", "std_dev", "median_time", "min_time", "max_time"]
].copy()
exec_times_table_display.columns = [
    "Processors",
    "Mean Time (s)",
    "Std Dev (s)",
    "Median Time (s)",
    "Min Time (s)",
    "Max Time (s)",
]
print(exec_times_table_display.to_string(index=False, float_format="%.4f"))


print("\n--- Speedup Table ---")
speedup_table_display = df_results[["processors", "speedup"]].copy()
speedup_table_display.columns = ["Processors", "Speedup (T_base/T_N)"]
print(speedup_table_display.to_string(index=False, float_format="%.4f"))

sns.set_theme(style="whitegrid")
plt.figure(figsize=(10, 6))
sns.lineplot(
    data=df_results,
    x="processors",
    y="mean_time",
    marker="o",
    label="Mean Execution Time",
)
plt.fill_between(
    df_results["processors"],
    df_results["mean_time"] - df_results["std_dev"],
    df_results["mean_time"] + df_results["std_dev"],
    alpha=0.2,
    label="Std Dev",
)
plt.xlabel("Number of Processors")
plt.ylabel("Mean Execution Time (seconds)")
plt.title("Execution Time by the Number of Processors")
plt.xticks(PROCESSOR_COUNTS)
plt.legend()
plt.grid(True)
plt.savefig(CHART_EXEC_TIME_FILE)
print(f"\nExecution times chart saved to {CHART_EXEC_TIME_FILE}")

plt.figure(figsize=(10, 6))
sns.lineplot(
    data=df_results, x="processors", y="speedup", marker="o", label="Actual Speedup"
)
ideal_speedup = [
    (
        p
        if df_results[df_results["processors"] == 1]["mean_time"].iloc[0] is not np.nan
        else np.nan
    )
    for p in df_results["processors"]
]
plt.plot(
    df_results["processors"],
    df_results["processors"],
    linestyle="--",
    color="red",
    label="Ideal Speedup",
)

plt.xlabel("Number of Processors")
plt.ylabel("Speedup (T_base / T_N)")
plt.title("Speedup by the Number of Processors")
plt.xticks(PROCESSOR_COUNTS)
plt.legend()
plt.grid(True)
plt.savefig(CHART_SPEEDUP_FILE)
print(f"Speedup chart saved to {CHART_SPEEDUP_FILE}")

print("\nBenchmarking and plotting completed.")
