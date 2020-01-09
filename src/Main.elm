module Main exposing (..)

import Browser
import Browser.Dom as Dom
import Dict exposing (Dict)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)


main : Program Flags Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Flags =
    {}


type alias Model =
    {}


type Msg
    = NoOp


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( {}, Cmd.none )



-- MODEL


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none



--port store : JE.Value -> Cmd msg
-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    ( {}, Cmd.none )



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = "", body = [] }
