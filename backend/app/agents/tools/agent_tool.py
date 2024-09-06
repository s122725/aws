from typing import Any, Callable, Generic, TypeVar, get_args, get_origin

from app.bedrock import ConverseApiToolSpec
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class RunResult(BaseModel):
    succeeded: bool
    body: str


class InvalidToolError(Exception):
    pass


class AgentTool(Generic[T]):
    def __init__(
        self,
        name: str,
        description: str,
        args_schema: type[T],
        function: Callable[[T], str],
    ):
        self.name = name
        self.description = description
        self.args_schema = args_schema
        self.function = function

    def _generate_input_schema(self) -> dict[str, Any]:
        """Converts the Pydantic model to a JSON schema."""
        return self.args_schema.model_json_schema()

    def to_converse_spec(self) -> ConverseApiToolSpec:
        inputSchema = {"json": self._generate_input_schema()}

        return ConverseApiToolSpec(
            name=self.name, description=self.description, inputSchema=inputSchema
        )

    def run(self, arg: T) -> RunResult:
        try:
            res = self.function(arg)
            return RunResult(succeeded=True, body=res)
        except Exception as e:
            return RunResult(succeeded=False, body=str(e))
