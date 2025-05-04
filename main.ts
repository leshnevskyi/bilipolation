import { parseArgs } from "@std/cli";
import * as path from "@std/path";
import { ResultAsync } from "neverthrow";
import { Image } from "imagescript";
import { enumi } from "@unielit/enumi";

import { normalizeError, ErrorCode } from "./error.ts";
import { logger } from "./logger.ts";
import { resizeImage } from "./image-resizer/mod.ts";
import { Stopwatch } from "./stopwatch.ts";
import { validatePositiveNumber } from "./validation.ts";

if (import.meta.main) {
  const CliArg = enumi("out-file", "scale", "processors");

  const args = parseArgs(Deno.args, {
    string: [CliArg.OutFile, CliArg.Scale, CliArg.Processors],
  });

  const sourceFilePath = args._.at(0)?.toString();

  if (sourceFilePath == undefined) {
    logger.error("No source file provided");
    Deno.exit(ErrorCode.InvalidArgs);
  }

  const sourceFileExt = path.extname(sourceFilePath);

  if (!sourceFileExt) {
    logger.error("Source file has no extension");
    Deno.exit(ErrorCode.InvalidArgs);
  }

  const sourceFileName = path.basename(sourceFilePath, sourceFileExt);

  const outputFilePathArg = args[CliArg.OutFile];

  const outputFileExt =
    (outputFilePathArg && path.extname(outputFilePathArg)) || sourceFileExt;

  const outputFileName = outputFilePathArg
    ? path.basename(outputFilePathArg, outputFileExt)
    : `${sourceFileName} (resized)`;

  const ouputDirName = path.dirname(outputFilePathArg || sourceFilePath);

  const outputFilePath = path.format({
    dir: ouputDirName,
    name: outputFileName,
    ext: outputFileExt,
  });

  const scaleArg = args[CliArg.Scale];

  if (scaleArg == undefined) {
    logger.error("No scale provided");
    Deno.exit(ErrorCode.InvalidArgs);
  }

  const scale = Number.parseFloat(scaleArg);
  const scaleValidationResult = validatePositiveNumber(scale);

  if (scaleValidationResult.isErr()) {
    logger.error(`Invalid scale: ${scaleValidationResult.error}`);
    Deno.exit(ErrorCode.InvalidArgs);
  }

  const processorsArg = args[CliArg.Processors];
  const processorCount = processorsArg ? Number.parseFloat(processorsArg) : 1;
  const processorCountValidationResult = validatePositiveNumber(processorCount);

  if (processorCountValidationResult.isErr()) {
    logger.error(
      `Invalid number of processors: ${processorCountValidationResult.error}`
    );
    Deno.exit(ErrorCode.InvalidArgs);
  }

  const dataResult = await ResultAsync.fromPromise(
    Deno.readFile(sourceFilePath),
    normalizeError
  );

  if (dataResult.isErr()) {
    logger.error(dataResult.error.message);
    Deno.exit(ErrorCode.Generic);
  }

  const data = dataResult.value;
  const imageDecodingResult = await ResultAsync.fromPromise(
    Image.decode(data),
    normalizeError
  );

  if (imageDecodingResult.isErr()) {
    logger.error(imageDecodingResult.error.message);
    Deno.exit(ErrorCode.Generic);
  }

  const image = imageDecodingResult.value;

  if (image.width <= 0 || image.height <= 0) {
    logger.error(
      `Cannot resize image with invalid dimensions: ${image.width}x${image.height}`
    );
    Deno.exit(ErrorCode.Generic);
  }

  const stopwatch = new Stopwatch({ startImmediately: true });
  const imageResizingResult = await resizeImage(image, scale, processorCount);
  logger.info(`Resizing took ${Math.round(stopwatch.stop())}ms`);

  if (imageResizingResult.isErr()) {
    logger.error(imageResizingResult.error);
    Deno.exit(ErrorCode.Generic);
  }

  const resizedImage = imageResizingResult.value;
  const encodedResizedImageResult = await ResultAsync.fromPromise(
    resizedImage.encode(),
    normalizeError
  );

  if (encodedResizedImageResult.isErr()) {
    logger.error(encodedResizedImageResult.error.message);
    Deno.exit(ErrorCode.Generic);
  }

  const encodedResizedImage = encodedResizedImageResult.value;
  const fileWritingResult = await ResultAsync.fromPromise(
    Deno.writeFile(outputFilePath, encodedResizedImage),
    normalizeError
  );

  if (fileWritingResult.isErr()) {
    logger.error(fileWritingResult.error.message);
    Deno.exit(ErrorCode.Generic);
  }

  logger.success(
    `Resized image (${resizedImage.width}x${resizedImage.height}) saved to ${outputFilePath}`
  );
}
